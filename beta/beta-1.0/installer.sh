#!/bin/bash
#Version 1.0
#This is the installer script
#The script is under GPL v2 License
#For new it runs only on a x64 ubuntu 14.04 
#Created by GIUMBAI

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
#Installing Samba
echo "Samba is now installing, please wait"
source samba.sh
#Installing  Utorrent
echo "Utorrent is now installing, please wait"
source utorrent.sh
#Installing virtualbox
echo "VirtualBox is now installing, please wait"
source virtualbox.sh
#Installing Plex media server
echo "Plex Media Server is now installing"
dpkg -i plex.deb