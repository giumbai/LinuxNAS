#!/bin/sh
#Script instalare utorrrent, phpvirtualbox, samba
#Ubdate ubuntu server
	if
		sudo apt-get --yes --force-yes update
		sudo apt-get --yes --force-yes upgrade
		sudo apt-get --yes --force-yes install sysvbanner
#		sudo apt-get dist-upgrade
#		sudo apt-get autoremove
		sudo apt-get clean
	then 
		echo "\033[7;36mUpdate executat corect\033[0m"
	else 
		clear
		echo "Problema la update"
		break
	fi
	clear
	banner "giumbai"
	if
		sudo apt-get --yes --force-yes install apache2
		sudo apt-get --yes --force-yes install php5 php5-cli php5-curl
		sudo apt-get --yes --force-yes install samba
	then
		echo "Apache + php5 + samba, instalat complet"
	else
		clear
		echo "Error apache or php5 or samba"
		break
	fi
#Configurare samba
	if
		mv -f smb.conf /etc/samba/
	then
		echo "\033[7;36msamba configurat corect\033[0m"
	else 
		clear
		echo "Samba conf error"
		break
	fi
#Instalare VirtualBox, utorrent
	if
		sudo apt-get install libssl0.9.8:i386
		tar xvzf utserver.tar.gz -C /opt/
		chmod -R 777 /opt/utorrent-server-alpha-v3_3/
		ln -s /opt/utorrent-server-alpha-v3_3/utserver /usr/bin/utserver
		sudo add-apt-repository ppa:hydr0g3n/qbittorrent-stable
		sudo apt-get update
#		sudo apt-get --yes --force-yes install qbittorrent qbittorrent-nox
#		sudo wget -O /etc/init.d/qbittorrent-nox-daemon http://launchpadlibrarian.net/38905385/qbittorrent
#		sudo chmod 755 /etc/init.d/qbittorrent-nox-daemon
#		sudo update-rc.d qbittorrent-nox-daemon defaults
	then
		clear
		echo "\033[7;36mtorrent instalat corect\033[0m"
	else
		echo "error utorrent"
		break
	fi	
	mkdir /var/www/scripts/
	mv ss.sh /var/www/scripts/
	#cat startup >> /etc/rc.local
	chmod +x /var/www/scripts/ss.sh
	chmod 777 /var/www/scripts/ss.sh
	if
		wget -q http://download.virtualbox.org/virtualbox/debian/oracle_vbox.asc -O- | sudo apt-key add -
		sudo add-apt-repository "deb http://download.virtualbox.org/virtualbox/debian trusty contrib"
		sudo apt-get update
		sudo apt-get --yes --force-yes install dkms unzip
		sudo apt-get --yes --force-yes install virtualbox-4.3 --no-install-recommends
		wget download.virtualbox.org/virtualbox/4.3.10/Oracle_VM_VirtualBox_Extension_Pack-4.3.10-93012.vbox-extpack
		VBoxManage extpack install Oracle_VM_VirtualBox_Extension_Pack-4.3.10-93012.vbox-extpack
		sudo apt-get --yes --force-yes install libapache2-mod-php5
		service apache2 restart
		echo "\033[7;36mPassword is 'pass', if not you need to modify the conf file\033[0m"
		adduser --ingroup vboxusers vbox
		wget 'http://downloads.sourceforge.net/project/phpvirtualbox/phpvirtualbox-4.3-1.zip' -O phpvirtualbox.zip
		unzip phpvirtualbox.zip -d /var/www/html/
		mv /var/www/html/phpvirtualbox-4.3-1 /var/www/html/vbox
		mv -f config.php /var/www/html/vbox/
		mv -f virtualbox /etc/default/
		mv /var/www/html/index.html /var/www/html/def.html
		/etc/init.d/vboxweb-service start
	then
		clear
		banner "FINISH"
		echo "Now you can acces virtual box at http://localhost/vbox, run "utserver -settingspath /opt/utorrent-server-alpha-v3_3/" and you can acces utorrent at http://localhost:8080/gui. Downt forget to reboot"
	else
		echo "error ecoutered at instalation!"
		break
	fi
	



