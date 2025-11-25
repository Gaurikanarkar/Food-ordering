pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:

  - name: node
    image: node:18
    command: ['cat']
    tty: true

  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ['cat']
    tty: true

  - name: kubectl
    image: bitnami/kubectl:latest
    command: ['cat']
    tty: true
    securityContext:
      runAsUser: 0
      readOnlyRootFilesystem: false
    env:
    - name: KUBECONFIG
      value: /kube/config
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig

  - name: dind
    image: docker:dind
    args: ["--storage-driver=overlay2", "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"]
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""

  volumes:
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
        }
    }

    stages {

        stage('Prepare Static Website') {
            steps {
                container('node') {
                    sh '''
                        echo "Static HTML/CSS/JS project — no npm build needed."
                        echo "Listing project files..."
                        ls -la
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                container('dind') {
                    sh '''
                        echo "Sleeping 10s to allow Docker daemon to start..."
                        sleep 10
                        echo "Building Docker image..."
                        docker build -t food:latest .
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    sh '''
                        sonar-scanner \
                            -Dsonar.projectKey=2401086-food \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                            -Dsonar.login=sqp_d73b3fdb83e56c241ab9b68c77acb1285f33ec3b
                    '''
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh '''
                        echo "Logging in to Nexus Registry..."
                        docker login nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085 \
                          -u admin -p Changeme@2025
                    '''
                }
            }
        }

        stage('Push to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        REGISTRY="nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
                        IMAGE_NAME="2401086/food"
                        IMAGE_TAG="v1"
                        FULL_IMAGE="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG"

                        echo "Tagging image: $FULL_IMAGE"
                        docker tag food:latest "$FULL_IMAGE"

                        echo "Pushing image to Nexus..."
                        docker push "$FULL_IMAGE"
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "Creating namespace 2401086 if not exists..."
                        kubectl create namespace 2401086 || echo "Namespace already exists"

                        echo "Applying deployment and service..."
                        kubectl apply -f k8s/deployment.yaml -n 2401086
                        kubectl get all -n 2401086
                        kubectl rollout status deployment/food-deployment -n 2401086
                    '''
                }
            }
        }

    }
}
