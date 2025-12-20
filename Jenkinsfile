pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:

  # Docker-in-Docker (build & push)
  - name: dind
    image: docker:24.0-dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
    args:
      - "--host=tcp://0.0.0.0:2375"
      - "--storage-driver=overlay2"
      - "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    volumeMounts:
    - name: docker-storage
      mountPath: /var/lib/docker

  # SonarQube scanner
  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true

  # kubectl for deployment
  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
    tty: true
    env:
    - name: KUBECONFIG
      value: /kube/config
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig

  volumes:
  - name: docker-storage
    emptyDir: {}

  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
    }
  }

  environment {
    APP_NAME      = "food-ordering"

    REGISTRY_URL  = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    REGISTRY_REPO = "2401086"

    SONAR_PROJECT = "food-ordering"
    SONAR_HOST_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
  }

  stages {

    stage('Build Docker Image') {
      steps {
        container('dind') {
          sh '''
            until docker info >/dev/null 2>&1; do
              echo "Waiting for Docker daemon..."
              sleep 2
            done

            docker version
            docker build -t ${APP_NAME}:${IMAGE_TAG} .
            docker images
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


    stage('Login to Docker Registry') {
      steps {
        container('dind') {
          sh 'docker --version'
          sh 'sleep 10'
          sh 'docker login nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085 -u admin -p Changeme@2025'
        }
      }
    }



    stage('Tag & Push Image to Nexus') {
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
            kubectl apply -f k8s/deployment.yaml
            kubectl apply -f k8s/service.yaml
            kubectl rollout status deployment/food-ordering-deployment -n 2401086
          '''
        }
      }
    }
  }
}
