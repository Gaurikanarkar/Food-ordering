pipeline {
    agent any

    stages {

        stage('Build Docker Image') {
            steps {
                sh '''
                docker build -t food-ordering:v1 .
                '''
            }
        }

        stage('SonarQube Analysis') {
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

        stage('Tag Image for Nexus') {
            steps {
                sh '''
                docker tag food-ordering:v1 nexus.imcc.com:8083/my-repository/2401086_food-ordering/food-ordering:v1
                '''
            }
        }

        stage('Login to Nexus') {
            steps {
                sh '''
                docker login nexus.imcc.com:8083 -u admin -p Changeme@2025
                '''
            }
        }

        stage('Push Image to Nexus') {
            steps {
                sh '''
                docker push nexus.imcc.com:8083/my-repository/2401086_food-ordering/food-ordering:v1
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
