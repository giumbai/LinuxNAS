#!/bin/bash
#Version 1.0
#This is the installer script
#The script is under GPL v2 License
#For now it runs only on a x64 ubuntu 14.04 
#Created by GIUMBAI
#Variables
st2="\033[91;40m"
st="\033[92m"
n="\033[0m"
logdate=$(date +"%d%m%y")
logfile="$logdate"_SLNAS_inst.log
#LogFile
cat <<- EOF > $logfile
This report is automatlic generated.
EOF

#Ensuring the OS compatibility
if [ -f /etc/lsb-release ]; then
	$INS
else
echo "You don't have the requerd OS"
break
fi
#Add the command to start all services
INS=$(echo "System compatibility succesfully checked, will now start the installer")
	sleep 3
	mv start /usr/bin/start-nas >> $logfile

	#Update the system and installing necesar things
	apt-get update >> $logfile
	apt-get upgrade -y >> $logfile
	apt-get install -y dkms unzip >> $logfile
	apt-get install -y libapache2-mod-php5 >> $logfile
	apt-get install -y sysvbanner >> $logfile
	apt-get install -y apache2 >> $logfile
	apt-get install -y php5 php5-cli php5-curl >> $logfile
	apt-get install -y libapache2-mod-php5 >> $logfile
	apt-get install -f >> $logfile
	service apache2 restart >> $logfile
	#Installing Samba
	echo "### Samba is now installing, please wait ###"
	source samba.sh >> $logfile
	#Installing  Utorrent
	echo "### Utorrent is now installing, please wait ###"
	source utorrent.sh >> $logfile
	#Installing virtualbox
	select option in "Install_VirtualBox" "Do_not_install_VirtualBox" "quit"
	do
		case "${option}" in
			Install_VirtualBox) source virtualbox.sh;;
			Do_not_install_VirtualBox) break ;;
			quit) break ;;
			*) echo "VirtualBox will not be installed!";;
		esac
	done
	#Installing Plex media server
	echo "### Plex Media Server is now installing ###"
	source plex.sh
	#The web interface
	cp -r web-interface/* /var/www/html
	clear 
	echo "#########################################################"
	echo "Now you can go to your local server ip address http://ip"
	echo "https://github.com/giumbai/LinuxNAS"
	echo "Use the comnad start-nas to start utorrent and VirtualBox"
	echo "Run dpkg -i plex.deb it's no need for this now, if the" 
	echo "installer encounters any problen just run apt-get install -y"
	echo "#########################################################"
