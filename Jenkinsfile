pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:

  - name: dind
    image: docker:24.0-dind
    workingDir: /home/jenkins/agent
    tty: true
    securityContext:
      privileged: true
    command: ["/bin/sh", "-c", "dockerd-entrypoint.sh"]
    args:
      - "--host=tcp://0.0.0.0:2375"
      - "--storage-driver=overlay2"
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
      - name: DOCKER_HOST
        value: tcp://localhost:2375
    volumeMounts:
      - name: docker-storage
        mountPath: /var/lib/docker
      - name: docker-config
        mountPath: /etc/docker/daemon.json
        subPath: daemon.json
      - name: workspace-volume
        mountPath: /home/jenkins/agent

  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    workingDir: /home/jenkins/agent
    tty: true
    command: ["/bin/sh", "-c", "sleep infinity"]
    volumeMounts:
      - name: workspace-volume
        mountPath: /home/jenkins/agent

  - name: kubectl
    image: bitnami/kubectl:latest
    workingDir: /home/jenkins/agent
    tty: true
    command: ["/bin/sh", "-c", "sleep infinity"]
    env:
      - name: KUBECONFIG
        value: /kube/config
    volumeMounts:
      - name: workspace-volume
        mountPath: /home/jenkins/agent
      - name: kubeconfig-secret
        mountPath: /kube/config
        subPath: kubeconfig

  volumes:
    - name: docker-storage
      emptyDir: {}
    - name: workspace-volume
      emptyDir: {}
    - name: kubeconfig-secret
      secret:
        secretName: kubeconfig-secret
    - name: docker-config
      configMap:
        name: docker-daemon-config
'''
    }
  }

  options {
    durabilityHint('MAX_SURVIVABILITY')
  }

  environment {
    APP_NAME      = "food-ordering"

    REGISTRY_URL  = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    REGISTRY_REPO = "2401086"

    SONAR_PROJECT = "food-ordering"
    SONAR_HOST_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
  }

  stages {

    stage('Agent Sanity Check') {
      steps {
        container('dind') {
          sh '''
            echo "Sanity check"
            whoami
            pwd
            ls -la
          '''
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        container('dind') {
          sh '''
            echo "Waiting for Docker daemon (max 60s)..."
            for i in $(seq 1 30); do
              if docker info >/dev/null 2>&1; then
                echo "Docker is ready"
                break
              fi
              sleep 2
            done

            docker version
            docker build -t ${APP_NAME}:latest .
          '''
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        container('sonar-scanner') {
          sh '''
            sonar-scanner \
              -Dsonar.projectKey=${SONAR_PROJECT} \
              -Dsonar.sources=. \
              -Dsonar.host.url=${SONAR_HOST_URL} \
              -Dsonar.login=sqa_da3fcbf5edab54300c5f5e4c5df6ff7ac0670303
          '''
        }
      }
    }


    stage('Login to Nexus Registry') {
      steps {
        container('dind') {
          sh '''
            echo "Logging into Nexus Docker registry"
            echo "Changeme@2025" | docker login ${REGISTRY_URL} \
              -u admin \
              --password-stdin
          '''
        }
      }
    }


    stage('Tag & Push Image') {
      steps {
        container('dind') {
          sh '''
            docker tag ${APP_NAME}:latest \
              ${REGISTRY_URL}/${REGISTRY_REPO}/${APP_NAME}:latest

            docker push ${REGISTRY_URL}/${REGISTRY_REPO}/${APP_NAME}:latest
            docker images
          '''
        }
      }
    }

    stage('Deploy Application') {
      steps {
        container('kubectl') {
          sh '''
            kubectl apply -f k8s/deployment.yaml -n ${NAMESPACE}
            kubectl apply -f k8s/service.yaml -n ${NAMESPACE}
            kubectl rollout status deployment/food-ordering-deployment -n ${NAMESPACE}
          '''
        }
      }
    }
  }
}
