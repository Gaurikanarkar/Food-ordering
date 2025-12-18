// pipeline {
//     agent {
//         kubernetes {
//             yaml '''
// apiVersion: v1
// kind: Pod
// spec:
//   containers:

//   - name: node
//     image: node:18
//     command: ['cat']
//     tty: true

//   - name: sonar-scanner
//     image: sonarsource/sonar-scanner-cli
//     command: ['cat']
//     tty: true

//   - name: kubectl
//     image: bitnami/kubectl:latest
//     command: ['cat']
//     tty: true
//     securityContext:
//       runAsUser: 0
//       readOnlyRootFilesystem: false
//     env:
//     - name: KUBECONFIG
//       value: /kube/config
//     volumeMounts:
//     - name: kubeconfig-secret
//       mountPath: /kube/config
//       subPath: kubeconfig

//   - name: dind
//     image: docker:dind
//     args: ["--storage-driver=overlay2", "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"]
//     securityContext:
//       privileged: true
//     env:
//     - name: DOCKER_TLS_CERTDIR
//       value: ""

//   volumes:
//   - name: kubeconfig-secret
//     secret:
//       secretName: kubeconfig-secret
// '''
//         }
//     }

//     // *** ADDED ***
//     environment {
//         SONAR_HOST = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
//         SONAR_AUTH = "sqp_47e2a797ae3cc173d07184483e7b25bf6fad1326"
//     }

//     stages {
//     stage('Checkout') {
//             steps {
//                 git url:'https://github.com/Gaurikanarkar/Food-ordering.git',branch:'main'
//             }
//         }


//         /* -------------------------
//            STATIC WEBSITE STEP
//            ------------------------- */
//         stage('Prepare Food-ordering Website') {
//             steps {
//                 container('node') {
//                     sh '''
//                         echo " website – static HTML/CSS site"
//                         echo "Listing project files..."
//                         ls -la
//                     '''
//                 }
//             }
//         }

//         /* -------------------------
//            DOCKER BUILD
//            ------------------------- */
//         stage('Build Docker Image') {
//             steps {
//                 container('dind') {
//                     sh '''
//                         sleep 10
//                         echo "=== Building food-ordering Docker Image ==="
//                         docker build -t food-ordering:latest .
//                     '''
//                 }
//             }
//         }

//         /* -------------------------
//            SONARQUBE ANALYSIS
//            ------------------------- */
//         stage('SonarQube Analysis') {
//             steps {
//                 container('sonar-scanner') {

//                     // *** ADDED: VALIDATE REACHABILITY BEFORE RUNNING ***
//                     sh '''
//                         echo "Checking SonarQube reachability..."
//                         curl -I ${SONAR_HOST} || echo "SonarQube not reachable, but running scanner anyway."
//                     '''

//                     sh '''
//                         sonar-scanner \
//                         -Dsonar.projectKey=2401086- \
//                         -Dsonar.sources=. \
//                         -Dsonar.host.url=${SONAR_HOST} \
//                         -Dsonar.token=${SONAR_AUTH}

                        
//                     '''
//                 }
//             }
//         }

//         /* -------------------------
//            DOCKER LOGIN TO NEXUS
//            ------------------------- */
//         stage('Login to Nexus Registry') {
//             steps {
//                 container('dind') {
//                     sh '''
//                         echo "Logging in to Nexus Docker Registry..."
//                         docker login nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085 \
//                           -u student -p Imcc@2025
//                     '''
//                 }
//             }
//         }

//         /* -------------------------
//            PUSH IMAGE TO NEXUS
//            ------------------------- */
//         stage('Push Food-ordering Image to Nexus') {
//             steps {
//                 container('dind') {
//                     sh '''
//                         echo "Tagging Food-ordering image..."
//                         docker tag food-ordering:latest nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/2401086_food-ordering/food-ordering:v1

//                         echo "Pushing food-ordering image to Nexus..."
//                         docker push nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085/2401086_food-ordering/food-ordering:v1
//                     '''
//                 }
//             }
//         }

//         /* -------------------------
//            CREATE NAMESPACE
//            ------------------------- */
//         stage('Create Namespace') {
//             steps {
//                 container('kubectl') {
//                     sh '''
//                         echo "Creating namespace 2401086 if not exists..."
//                         kubectl create namespace 2401086 || echo "Namespace already exists"
//                         kubectl get ns
//                     '''
//                 }
//             }
//         }

//         /* -------------------------
//            DEPLOY TO KUBERNETES
//            ------------------------- */
//         stage('Deploy to Kubernetes') {
//             steps {
//                 container('kubectl') {
//                     sh '''
//                         echo "Applying Food-ordering Kubernetes Deployment & Service..."

//                         kubectl apply -f k8s/deployment.yaml -n 2401086
//                         kubectl apply -f k8s/service.yaml -n 2401086

//                         echo "Checking all resources..."
//                         kubectl get all -n 2401086

//                         echo "Waiting for rollout..."
//                         kubectl rollout status deployment/food-frontend-deployment -n 2401086 --timeout=120s
 
//                     '''
//                 }
//             }
//         }

//         /* -------------------------
//            DEBUG
//            ------------------------- */
//         stage('Debug Pods') {
//             steps {
//                 container('kubectl') {
//                     sh '''
//                         echo "[DEBUG] Listing Pods..."
//                         kubectl get pods -n 2401086

//                         echo "[DEBUG] Describe Pods..."
//                         kubectl describe pods -n 2401086 | head -n 200
//                     '''
//                 }
//             }
//         }
//     }
// }

pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:

  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true

  - name: kubectl
    image: bitnami/kubectl:latest
    command: ["cat"]
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
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
    volumeMounts:
    - name: docker-config
      mountPath: /etc/docker/daemon.json
      subPath: daemon.json

  volumes:
  - name: docker-config
    configMap:
      name: docker-daemon-config
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
        }
    }

    environment {
        SONAR_HOST = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
        REGISTRY   = "nexus.imcc.com:8085"
        IMAGE      = "2401086_food-ordering/food-ordering:v1"
    }

    stages {

        stage('Build Docker Image') {
            steps {
                container('dind') {
                    sh '''
                        echo "Building food-ordering Docker image..."
                        sleep 10
                        docker build -t food-ordering:latest .
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    withCredentials([
                        string(credentialsId: 'sonartoken-2401086', variable: 'SONAR_TOKEN')
                    ]) {
                        sh '''
                            sonar-scanner \
                              -Dsonar.projectKey=2401086- \
                              -Dsonar.sources=. \
                              -Dsonar.exclusions=node_modules/**,dist/** \
                              -Dsonar.host.url=${SONAR_HOST} \
                              -Dsonar.token=${SONAR_TOKEN}
                        '''
                    }
                }
            }
        }

        stage('Login to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        docker login ${REGISTRY} \
                          -u student -p Imcc@2025
                    '''
                }
            }
        }

        stage('Tag & Push Image') {
            steps {
                container('dind') {
                    sh '''
                        docker tag food-ordering:latest ${REGISTRY}/${IMAGE}
                        docker push ${REGISTRY}/${IMAGE}
                        docker image ls
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    dir('k8s') {
                        sh '''
                            echo "Deploying food-ordering application..."

                            kubectl apply -f deployment.yaml -n 2401086
                            kubectl apply -f service.yaml -n 2401086
                            kubectl apply -f ingress.yaml -n 2401086

                            kubectl rollout status deployment/food-ordering-frontend-deployment \
                              -n 2401086 --timeout=120s
                        '''
                    }
                }
            }
        }
    }
}