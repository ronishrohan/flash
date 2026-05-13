# DevOps Lab Command Reference
# Source: Devops-Lab-Manual.pdf
# Format: copy-paste-friendly commands with short comments.

# -----------------------------------------------------------------------------
# Experiment 1: Maven and Gradle setup on Ubuntu
# -----------------------------------------------------------------------------

# Update package lists before installing build tools
sudo apt update

# Upgrade existing packages
sudo apt upgrade -y

# Install Java for Maven
sudo apt install openjdk-11-jdk -y

# Confirm Java is installed
java -version

# Install Maven
sudo apt install maven -y

# Check Maven version
mvn -version

# Install Gradle from Ubuntu repositories
sudo apt-get install gradle -y

# Verify Gradle installation
gradle -v

# Install Jenkins prerequisites
sudo apt update
sudo apt upgrade -y
sudo apt install openjdk-17-jdk -y
java -version

# Add Jenkins repository key
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -

# Add Jenkins repository
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start and check Jenkins service
sudo systemctl start jenkins
sudo systemctl status jenkins

# Install Ansible
sudo apt update
sudo apt install ansible -y

# Verify Ansible installation
ansible --version

# -----------------------------------------------------------------------------
# Experiment 2: Create and build a Maven project
# -----------------------------------------------------------------------------

# Generate a Maven quickstart project
mvn archetype:generate -DgroupId=com.example -DartifactId=MyMavenApp -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false

# Move into the generated project
cd MyMavenApp

# Build the project
mvn compile
mvn test
mvn package

# Clean build outputs
mvn clean

# -----------------------------------------------------------------------------
# Experiment 3: Create and build a Gradle project
# -----------------------------------------------------------------------------

# Confirm Gradle is available
gradle -v

# Create a new Gradle Java application project
mkdir HelloGradle
cd HelloGradle
gradle init --type java-application

# Run a custom Gradle task
gradle hello

# Build the project
gradle build

# Run the application
gradle run

# If you use the Gradle wrapper, run the same task through the wrapper
./gradlew hello

# -----------------------------------------------------------------------------
# Experiment 4: Maven app, then migrate the same app to Gradle
# -----------------------------------------------------------------------------

# Create the Maven project
mvn archetype:generate -DgroupId=com.example -DartifactId=HelloMaven -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false

# Enter the Maven project
cd HelloMaven

# Build the Maven project
mvn package

# Run the packaged JAR
java -cp target/HelloMaven-1.0-SNAPSHOT.jar com.example.App

# Create the Gradle project
cd ..
mkdir HelloMavenGradle
cd HelloMavenGradle
gradle init --type java-application

# Build and run the Gradle version
gradle build
gradle run

# -----------------------------------------------------------------------------
# Experiment 5: Jenkins local install and first use
# -----------------------------------------------------------------------------

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Java
sudo apt install openjdk-17-jdk -y
java -version

# Add Jenkins key and repository
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'

# Install Jenkins
sudo apt update
sudo apt install jenkins -y

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl status jenkins

# Retrieve the initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# -----------------------------------------------------------------------------
# Experiment 5: Jenkins on Docker
# -----------------------------------------------------------------------------

# Install Docker
sudo apt update
sudo apt upgrade -y
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker
docker --version

# Pull Jenkins image
sudo docker pull jenkins/jenkins:lts

# Run Jenkins container
sudo docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts

# Inspect running containers
sudo docker ps

# -----------------------------------------------------------------------------
# Experiment 6: Jenkins CI pipeline with Maven or Gradle
# -----------------------------------------------------------------------------

# Generate an SSH key for GitHub access
ssh-keygen -t ed25519 -C "your_email@example.com"

# Configure Git identity
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Set the remote origin
git remote add origin git@github.com:cmritsarada/exp6.git

# Make Git remember the upstream branch on first push
git config --global push.autoSetupRemote true

# Example Jenkins pipeline shell steps
# sh 'mvn clean package'
# sh 'mvn test'
# archiveArtifacts artifacts: '**/target/*.jar', allowEmptyArchive: true
# ansible-playbook -i hosts.ini deploy.yml --extra-vars='ansible_become_pass=exam@cse'

# -----------------------------------------------------------------------------
# Experiment 7: Ansible basics
# -----------------------------------------------------------------------------

# Update and install Ansible
sudo apt update
sudo apt upgrade -y
sudo apt install ansible -y
ansible --version

# Create an inventory file for localhost
gedit hosts.ini

# Create a custom module directory
mkdir -p library
cd library
gedit firstmodule.py

# Make the module executable
chmod +x library/firstmodule.py

# Return to the parent directory
cd ..

# Create a playbook that uses the custom module
gedit secondpb.yml

# Run the playbook
ansible-playbook -i hosts.ini secondpb.yml

# -----------------------------------------------------------------------------
# Experiment 8: Jenkins + Ansible deployment pipeline
# -----------------------------------------------------------------------------

# Create the placeholder artifact file used in the lab
gedit t.jar

# Check the file size
ls -l /home/student/t.jar

# Example Jenkins pipeline stage for deployment
# sh """
# export ANSIBLE_HOST_KEY_CHECKING=False
# ansible-playbook -i hosts.ini deploy.yml --extra-vars='ansible_become_pass=exam@cse'
# """

# Example inventory for local deployment
# [local]
# localhost ansible_connection=local

# -----------------------------------------------------------------------------
# Experiment 9: Azure DevOps setup
# -----------------------------------------------------------------------------

# No terminal command is required for the initial Azure DevOps signup flow.
# This experiment is mostly browser-based.

# -----------------------------------------------------------------------------
# Experiment 10: Azure Pipelines for Maven/Gradle build and tests
# -----------------------------------------------------------------------------

# The lab mainly uses Azure Pipelines YAML, not terminal commands.
# The Maven build/test core still follows these commands:
mvn clean package
mvn test

# -----------------------------------------------------------------------------
# Experiment 11: Azure release pipelines
# -----------------------------------------------------------------------------

# No direct terminal command is required for the release-pipeline UI steps.

# -----------------------------------------------------------------------------
# Experiment 12: Azure pipeline with Key Vault
# -----------------------------------------------------------------------------

# Build the project with Maven Wrapper
./mvnw clean install

# -----------------------------------------------------------------------------
# Extra Program 1: Convert a Gradle project to Maven
# -----------------------------------------------------------------------------

# Publish Gradle metadata locally and generate POM output
./gradlew publishToMavenLocal

# Verify the converted Maven build
./mvnw clean install

# -----------------------------------------------------------------------------
# Extra Program 2: Docker containerization of a web application
# -----------------------------------------------------------------------------

# Create the project directory
mkdir docker-webapp
cd docker-webapp

# Build and run the Docker image
docker build -t devops-webapp .
docker run -d -p 8080:80 devops-webapp

# Open the app in a browser
# http://localhost:8080

