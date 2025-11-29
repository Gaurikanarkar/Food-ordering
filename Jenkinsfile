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

        stage('Prepare Static Files') {
            steps {
                container('node') {
                    sh '''
                        echo "Static Website — No build required."
                        echo "Displaying project files:"
                        ls -la
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                container('dind') {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'dockerhub-creds',
                            usernameVariable: 'DOCKERHUB_USER',
                            passwordVariable: 'DOCKERHUB_PASS'
                        )
                    ]) {
                        sh '''
                            echo "Waiting for Docker daemon..."
                            sleep 15

                            echo "Logging in to Docker Hub..."
                            echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin

                            echo "Building Docker image..."
                            docker build -t food-ordering:latest .
                        '''
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        script {
                            catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                                sh '''
                                    sonar-scanner \
                                      -Dsonar.projectKey=2401086-food \
                                      -Dsonar.sources=. \
                                      -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                                      -Dsonar.token=$SONAR_TOKEN
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh '''
                        echo "Logging into Nexus Registry..."
                        docker login nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085 -u admin -p Changeme@2025
                    '''
                }
            }
        }

        stage('Push to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        echo "Tagging Docker image..."
                        docker tag food-ordering:latest nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/2401086/food-ordering:v1

                        echo "Pushing to Nexus..."
                        docker push nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/2401086/food-ordering:v1
                    '''
                }
            }
        }

        stage('Create Namespace') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "Ensuring namespace 2401086 exists..."
                        kubectl get namespace 2401086 || kubectl create namespace 2401086
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "Deploying to Kubernetes Namespace: 2401086"

                        kubectl apply -f k8s/deployment.yaml -n 2401086
                        kubectl apply -f k8s/service.yaml -n 2401086

                        echo "Resources in namespace 2401086:"
                        kubectl get all -n 2401086
                    '''
                }
            }
        }

        // 🆕 Debug stage to see why ImagePullBackOff happens
        stage('Debug Pod Image Pull') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "===== Describe food-ordering pod ====="
                        kubectl describe pod -l app=food-ordering -n 2401086 || true

                        echo ""
                        echo "===== Last events in namespace 2401086 ====="
                        kubectl get events -n 2401086 --sort-by=.lastTimestamp | tail -n 20 || true
                    '''
                }
            }
        }

        stage('Show Cluster Nodes & Service Info') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "===== Kubernetes Nodes ====="
                        kubectl get nodes -o wide

                        echo ""
                        echo "===== Services in namespace 2401086 ====="
                        kubectl get svc -n 2401086

                        echo ""
                        echo "If food-ordering-service shows 80:31086/TCP,"
                        echo "open:  http://192.168.20.250:31086  in your browser."
                    '''
                }
            }
        }
    }
}
