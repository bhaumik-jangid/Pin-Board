pipeline {
  agent any

  environment {
    REGISTRY   = credentials('dockerhub-username')   // set in Jenkins credentials
    IMAGE_TAG  = "${env.BUILD_NUMBER}"
    COMPOSE    = "docker-compose"
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {

    // ── 1. Checkout ─────────────────────────────────────────
    stage('Checkout') {
      steps {
        checkout scm
        echo "Building commit: ${env.GIT_COMMIT?.take(8)}"
      }
    }

    // ── 2. Install dependencies ──────────────────────────────
    stage('Install') {
      parallel {
        stage('Frontend deps') {
          steps {
            dir('frontend') { sh 'npm ci --prefer-offline' }
          }
        }
        stage('Auth service deps') {
          steps {
            dir('services/auth-service') { sh 'npm ci --prefer-offline' }
          }
        }
        stage('Board service deps') {
          steps {
            dir('services/board-service') { sh 'npm ci --prefer-offline' }
          }
        }
        stage('Realtime service deps') {
          steps {
            dir('services/realtime-service') { sh 'npm ci --prefer-offline' }
          }
        }
      }
    }

    // ── 3. Type check ────────────────────────────────────────
    stage('Typecheck') {
      parallel {
        stage('Frontend tsc')      { steps { dir('frontend')                     { sh 'npx tsc --noEmit' } } }
        stage('Auth tsc')          { steps { dir('services/auth-service')        { sh 'npx tsc --noEmit' } } }
        stage('Board tsc')         { steps { dir('services/board-service')       { sh 'npx tsc --noEmit' } } }
        stage('Realtime tsc')      { steps { dir('services/realtime-service')    { sh 'npx tsc --noEmit' } } }
      }
    }

    // ── 4. Build ─────────────────────────────────────────────
    stage('Build') {
      parallel {
        stage('Frontend build') {
          steps {
            dir('frontend') { sh 'npm run build' }
          }
        }
        stage('Auth service build') {
          steps {
            dir('services/auth-service') { sh 'npm run build' }
          }
        }
        stage('Board service build') {
          steps {
            dir('services/board-service') { sh 'npm run build' }
          }
        }
        stage('Realtime service build') {
          steps {
            dir('services/realtime-service') { sh 'npm run build' }
          }
        }
      }
    }

    // ── 5. Docker build ──────────────────────────────────────
    stage('Docker Build') {
      steps {
        script {
          sh """
            DOCKER_BUILDKIT=1 docker build \
              --cache-from ${REGISTRY}/pinboard-frontend:latest \
              -t ${REGISTRY}/pinboard-frontend:${IMAGE_TAG} \
              -t ${REGISTRY}/pinboard-frontend:latest \
              ./frontend

            DOCKER_BUILDKIT=1 docker build \
              --cache-from ${REGISTRY}/pinboard-auth:latest \
              -t ${REGISTRY}/pinboard-auth:${IMAGE_TAG} \
              -t ${REGISTRY}/pinboard-auth:latest \
              ./services/auth-service

            DOCKER_BUILDKIT=1 docker build \
              --cache-from ${REGISTRY}/pinboard-board:latest \
              -t ${REGISTRY}/pinboard-board:${IMAGE_TAG} \
              -t ${REGISTRY}/pinboard-board:latest \
              ./services/board-service

            DOCKER_BUILDKIT=1 docker build \
              --cache-from ${REGISTRY}/pinboard-realtime:latest \
              -t ${REGISTRY}/pinboard-realtime:${IMAGE_TAG} \
              -t ${REGISTRY}/pinboard-realtime:latest \
              ./services/realtime-service
          """
        }
      }
    }

    // ── 6. Push to Docker Hub ────────────────────────────────
    stage('Docker Push') {
      steps {
        withDockerRegistry([credentialsId: 'dockerhub-creds', url: '']) {
          sh """
            docker push ${REGISTRY}/pinboard-frontend:${IMAGE_TAG}
            docker push ${REGISTRY}/pinboard-frontend:latest
            docker push ${REGISTRY}/pinboard-auth:${IMAGE_TAG}
            docker push ${REGISTRY}/pinboard-auth:latest
            docker push ${REGISTRY}/pinboard-board:${IMAGE_TAG}
            docker push ${REGISTRY}/pinboard-board:latest
            docker push ${REGISTRY}/pinboard-realtime:${IMAGE_TAG}
            docker push ${REGISTRY}/pinboard-realtime:latest
          """
        }
      }
    }

    // ── 7. Deploy ────────────────────────────────────────────
    stage('Deploy') {
      steps {
        script {
          sh """
            export IMAGE_TAG=${IMAGE_TAG}
            docker-compose pull mongo redis
            docker-compose up -d --build --remove-orphans
            docker-compose ps
          """
          // Health check — wait for all services
          sh """
            echo "Waiting for services to be healthy..."
            sleep 10
            docker-compose ps | grep -v "Exit"
            curl -f http://localhost/health || exit 1
            echo "✅ Deployment successful — build ${IMAGE_TAG}"
          """
        }
      }
    }
  }

  post {
    success {
      echo "✅ Build ${IMAGE_TAG} deployed successfully"
      // Add Slack/email notification here if needed
    }
    failure {
      echo "❌ Build ${IMAGE_TAG} failed"
      sh 'docker-compose logs --tail=50 || true'
    }
    always {
      // Clean up dangling images
      sh 'docker image prune -f || true'
    }
  }
}
