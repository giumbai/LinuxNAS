#!/bin/bash
#Version 1.0
#This is the installer for samba
apt-get install -y samba samba-common python-glade2 system-config-samba
#Here is the configuration of samba
mv -f smb.conf /etc/samba/smb.conf
#Restart the samba service
service smbd restart