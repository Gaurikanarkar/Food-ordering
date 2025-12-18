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

  - name: node
    image: node:18
    command: ["cat"]
    tty: true

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
    image: docker:24.0-dind
    securityContext:
      privileged: true
    args:
      - "--storage-driver=overlay2"
      - "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
    volumeMounts:
      - name: docker-storage
        mountPath: /var/lib/docker

  volumes:
    - name: kubeconfig-secret
      secret:
        secretName: kubeconfig-secret

    - name: docker-storage
      emptyDir: {}

'''
        }
    }

    environment {
        VITE_API_KEY = credentials('SPOONACULAR_API_KEY')
        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        IMAGE    = "2401086/food-ordering"
        VERSION  = "v5"  // 🔥 UPDATE VERSION EACH DEPLOYMENT
    }

    stages {

        /* ------------------------- FRONTEND BUILD ------------------------- */
        stage('Install + Build Frontend') {
            steps {
                container('node') {
                    sh '''
                        echo "Building frontend at repo root"
                        export VITE_API_KEY=$VITE_API_KEY
                        npm install
                        npm run build
                        ls -la
                    '''
                }
            }
        }



        /* ------------------------- DOCKER BUILD --------------------------- */
        stage('Build Docker Image') {
            steps {
                container('dind') {
                    sh '''
                        echo "Waiting for Docker daemon..."
                        sleep 10
                        docker version
                        docker build -t $IMAGE:$VERSION .
                    '''
                }
            }
        }



        /* ------------------------- SONARQUBE ------------------------------ */
        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=2401086 \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000 \
                          -Dsonar.login=sqp_47e2a797ae3cc173d07184483e7b25bf6fad1326
                    '''
                }
            }
        }

        /* ---------------------- DOCKER LOGIN ------------------------------ */
        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh '''
                        echo "Logging into Nexus..."
                        docker login $REGISTRY -u admin -p Changeme@2025
                    '''
                }
            }
        }

        /* ---------------------- PUSH IMAGE ------------------------------- */
        stage('Push to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        echo "Tagging and pushing image..."
                        docker tag $IMAGE:$VERSION $REGISTRY/$IMAGE:$VERSION
                        docker push $REGISTRY/$IMAGE:$VERSION
                    '''
                }
            }
        }

        /* ---------------------- DEPLOY TO K8S ----------------------------- */
        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh """
                        echo "Updating Kubernetes deployment..."
                        kubectl set image deployment/recipe-finder-deployment food-ordering=$REGISTRY/$IMAGE:$VERSION -n 2401086

                       
                    """
                }
            }
        }
    }
}