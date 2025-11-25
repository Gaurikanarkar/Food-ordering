pipeline {
    agent {
        kubernetes {
            yaml """
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
    args:
      - "--storage-driver=overlay2"
      - "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""

  volumes:
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
"""
        }
    }

    stages {

        stage('Prepare Static Website') {
            steps {
                container('node') {
                    sh '''
                        echo "No build required — static HTML website"
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
                        echo "Waiting for Docker daemon to be ready..."

                        # Try for ~60 seconds
                        for i in $(seq 1 30); do
                          if docker info >/dev/null 2>&1; then
                            echo "Docker daemon is ready"
                            break
                          fi
                          echo "Docker not ready yet, retrying in 2s... ($i/30)"
                          sleep 2
                        done

                        # Final check – if still not ready, fail clearly
                        if ! docker info >/dev/null 2>&1; then
                          echo "Docker daemon is still not reachable. Failing build."
                          exit 1
                        fi

                        echo "Building Docker image (local tag)..."
                        docker build -t food-ordering:latest .
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
                    withCredentials([usernamePassword(
                        credentialsId: 'nexus-docker-creds',
                        usernameVariable: 'REG_USER',
                        passwordVariable: 'REG_PASS'
                    )]) {
                        sh '''
                            echo "Logging in to Nexus Docker Registry..."
                            echo "$REG_PASS" | docker login nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085 \
                              -u "$REG_USER" --password-stdin
                        '''
                    }
                }
            }
        }

        stage('Push Docker Image to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        REGISTRY="nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
                        IMAGE_NAME="2401086/food-ordering"
                        IMAGE_TAG="v1"
                        FULL_IMAGE="$REGISTRY/$IMAGE_NAME:$IMAGE_TAG"

                        echo "Tagging image for Nexus: $FULL_IMAGE"
                        docker tag food-ordering:latest "$FULL_IMAGE"

                        echo "Pushing image to Nexus..."
                        docker push "$FULL_IMAGE"
                    '''
                }
            }
        }

        stage('Create Namespace') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "Creating namespace 2401086 if not exists..."
                        kubectl create namespace 2401086 || echo "Namespace already exists"
                        kubectl get ns
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        set -x
                        ls -la
                        ls -la k8s

                        kubectl apply -f k8s/deployment.yaml -n 2401086
                        kubectl apply -f k8s/service.yaml -n 2401086

                        kubectl get all -n 2401086
                        kubectl rollout status deployment/food-ordering-deployment -n 2401086
                    '''
                }
            }
        }

        stage('Debug Pods') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "[DEBUG] Listing Pods..."
                        kubectl get pods -n 2401086

                        echo "[DEBUG] Describing Pods..."
                        kubectl describe pods -n 2401086 | head -n 200
                    '''
                }
            }
        }

    }
}
