pipeline {
    agent any

    environment {
        REGISTRY = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        IMAGE = "my-repository/2401086_food-ordering/food-ordering:v1"
    }

    stages {

        stage('SonarQube Scan') {
            steps {
                sh '''
                sonar-scanner \
                  -Dsonar.projectKey=food-ordering \
                  -Dsonar.sources=. \
                  -Dsonar.host.url=http://sonarQube.imcc.com:9000 \
                  -Dsonar.login=sqa_da3fcbf5edab54300c5f5e4c5df6ff7ac0670303
                '''
            }
        }

        stage('Build & Push Image (Kaniko)') {
            steps {
                sh '''
                /kaniko/executor \
                  --context $(pwd) \
                  --dockerfile Dockerfile \
                  --destination=${REGISTRY}/${IMAGE} \
                  --skip-tls-verify
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                kubectl apply -f deployment.yaml
                kubectl apply -f service.yaml
                '''
            }
        }
    }
}
