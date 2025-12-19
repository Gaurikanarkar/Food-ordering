properties([
  pipelineTriggers([]),
  durabilityHint('PERFORMANCE_OPTIMIZED')
])

pipeline {

  agent {
    kubernetes {
      yaml """
apiVersion: v1
kind: Pod
spec:
  containers:

  - name: dind
    image: docker:dind
    securityContext:
      privileged: true
    command: ["dockerd-entrypoint.sh"]
    args:
      - "--host=tcp://0.0.0.0:2375"
      - "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
    volumeMounts:
      - name: docker-storage
        mountPath: /var/lib/docker
      - name: workspace-volume
        mountPath: /home/jenkins/agent

  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true
    volumeMounts:
      - name: workspace-volume
        mountPath: /home/jenkins/agent

  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
    tty: true
    securityContext:
      runAsUser: 0
      readOnlyRootFilesystem: false
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
"""
    }
  }

  environment {
    DOCKER_IMAGE  = "food-ordering"
    REGISTRY_HOST = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    REGISTRY      = "${REGISTRY_HOST}/2401086"
    NAMESPACE     = "2401086"

    SONAR_PROJECT = "2401086_food-ordering"
    SONAR_TOKEN   = "sqa_da3fcbf5edab54300c5f5e4c5df6ff7ac0670303"
  }

  stages {

    stage('Build Docker Image') {
      steps {
        container('dind') {
          sh """
            echo "⏳ Building Docker image..."
            docker build --no-cache -t ${DOCKER_IMAGE}:${BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest .
          """
        }
      }
    }

    stage('SonarQube Analysis') {
      steps {
        container('sonar-scanner') {
          sh """
            sonar-scanner \
              -Dsonar.projectKey=${SONAR_PROJECT} \
              -Dsonar.sources=. \
              -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
              -Dsonar.token=${SONAR_TOKEN}
          """
        }
      }
    }

    stage('Login to Nexus') {
      steps {
        container('dind') {
          sh """
            docker login ${REGISTRY_HOST} -u admin -p Changeme@2025
          """
        }
      }
    }

    stage('Push Image') {
      steps {
        container('dind') {
          sh """
            docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER}
            docker tag ${DOCKER_IMAGE}:${BUILD_NUMBER} ${REGISTRY}/${DOCKER_IMAGE}:latest

            docker push ${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER}
            docker push ${REGISTRY}/${DOCKER_IMAGE}:latest
          """
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        container('kubectl') {
          dir('k8s') {
            sh """
              echo "🚀 Deploying food-ordering application..."
              kubectl apply -f deployment.yaml -n ${NAMESPACE}
              kubectl apply -f service.yaml -n ${NAMESPACE}

              echo "⏳ Waiting for rollout..."
              kubectl rollout status deployment/food-ordering-deployment -n ${NAMESPACE}
            """
          }
        }
      }
    }
  }

  post {
    success { echo "🎉 food-ordering CI/CD Pipeline completed successfully!" }
    failure { echo "❌ food-ordering CI/CD Pipeline failed" }
    always  { echo "🔄 Pipeline finished" }
  }
}
