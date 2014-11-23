#!/bin/bash
#Version 1.0
#This is the installer for Utorrent
apt-get install libssl0.9.8:i386 -y
mv utorrent /opt/utorrent
chmod -R 777 /opt/utorrent
ln -s /opt/utorrent/utserver /usr/bin/utserver
#This will install utorrent 64 edition
#To start utorrent use utserver -settingspath /opt/utorrent/ &
#This should be added to the system startup
#Utorrent can be accessed at http://localhost:8080/gui/