#!/bin/bash
#Version 1.0
#This is the installer script

#Add the command to start all services
mv start /usr/bin/start-nas
#The needed repositories
add-apt-repository "deb http://download.virtualbox.org/virtualbox/debian trusty contrib"
#Update the system and installing necesar things
apt-get update
apt-get upgrade -y
apt-get install -y dkms unzip
apt-get install -y libapache2-mod-php5
apt-get install -y sysvbanner
apt-get install -y apache2
apt-get install -y php5 php5-cli php5-curl
apt-get install -y libapache2-mod-php5
service apache2 restart