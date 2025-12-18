pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:

  # Docker CLI container
  - name: docker
    image: docker:24.0-cli
    command: ["cat"]
    tty: true
    env:
      - name: DOCKER_HOST
        value: tcp://dind:2375

  # Docker daemon (DinD)
  - name: dind
    image: docker:24.0-dind
    securityContext:
      privileged: true
    args:
      - "--host=tcp://0.0.0.0:2375"
      - "--storage-driver=overlay2"
      - "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
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
    REGISTRY    = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    IMAGE_NAME  = "my-repository/2401086_food-ordering/food-ordering"
    IMAGE_TAG   = "v1"

    SONAR_HOST  = "http://sonarQube.imcc.com:9000"
    SONAR_TOKEN = "sqa_da3fcbf5edab54300c5f5e4c5df6ff7ac0670303"

    NEXUS_USER  = "admin"
    NEXUS_PASS  = "Changeme@2025"
  }

  stages {

    stage('Build Docker Image') {
      steps {
        container('docker') {
          sh '''
          docker build -t food-ordering:v1 .
          '''
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        container('sonar-scanner') {
          sh '''
          sonar-scanner \
            -Dsonar.projectKey=food-ordering \
            -Dsonar.sources=. \
            -Dsonar.host.url=${SONAR_HOST} \
            -Dsonar.login=${SONAR_TOKEN}
          '''
        }
      }
    }

    stage('Tag Image for Nexus') {
      steps {
        container('docker') {
          sh '''
          docker tag food-ordering:v1 ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
          '''
        }
      }
    }

    stage('Login to Nexus') {
      steps {
        container('docker') {
          sh '''
          docker login ${REGISTRY} \
            -u ${NEXUS_USER} \
            -p ${NEXUS_PASS}
          '''
        }
      }
    }

    stage('Push Image to Nexus') {
      steps {
        container('docker') {
          sh '''
          docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        container('kubectl') {
          sh '''
          kubectl apply -f k8s/deployment.yaml
          kubectl apply -f k8s/service.yaml
          '''
        }
      }
    }
  }
}
