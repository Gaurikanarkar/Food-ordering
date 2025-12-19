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

  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true

  volumes:
    - name: docker-storage
      emptyDir: {}
'''
    }
  }

  environment {
    APP_NAME     = "food-ordering"
    IMAGE_TAG    = "v1"

    REGISTRY_URL = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    REGISTRY_REPO = "my-repository/2401086_food-ordering"

    SONAR_PROJECT = "food-ordering"
    SONAR_HOST_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
  }

  stages {

    stage('Build Docker Image') {
      steps {
        container('dind') {
          sh 'until docker info >/dev/null 2>&1; do sleep 2; done'
          sh 'docker version'
          sh 'docker build -t food-ordering:v1 .'
          sh 'docker images'
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        container('sonar-scanner') {
          sh 'sonar-scanner -Dsonar.projectKey=food-ordering -Dsonar.sources=. -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 -Dsonar.login=sqa_da3fcbf5edab54300c5f5e4c5df6ff7ac0670303'
        }
      }
    }

    stage('Login to Nexus') {
      steps {
        container('dind') {
          sh 'docker login nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085 -u admin -p Changeme@2025'
        }
      }
    }

    stage('Tag & Push Image') {
      steps {
        container('dind') {
          sh 'docker tag food-ordering:v1 nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/my-repository/2401086_food-ordering/food-ordering:v1'
          sh 'docker push nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/my-repository/2401086_food-ordering/food-ordering:v1'
        }
      }
    }

    stage('Deploy Application') {
      steps {
        container('dind') {
          sh 'apk add --no-cache curl'
          sh 'curl -LO https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl'
          sh 'chmod +x kubectl'
          sh 'mv kubectl /usr/local/bin/kubectl'
          sh 'kubectl version --client'

          sh 'kubectl get ns food-ordering || kubectl create ns food-ordering'

          sh 'kubectl set image deployment/food-ordering-deployment food-ordering=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/my-repository/2401086_food-ordering/food-ordering:v1 -n food-ordering'

          sh 'kubectl rollout status deployment/food-ordering-deployment -n food-ordering --timeout=120s'
        }
      }
    }
  }
}
