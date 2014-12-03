#!/bin/bash
#Version 1.0
#VirtualBox installer and PHP VirtualBox installer
wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -
add-apt-repository "deb http://download.virtualbox.org/virtualbox/debian trusty contrib"
apt-get update 

apt-get install -y virtualbox-4.3
wget download.virtualbox.org/virtualbox/4.3.20/Oracle_VM_VirtualBox_Extension_Pack-4.3.20-96996.vbox-extpack
VBoxManage extpack install Oracle_VM_VirtualBox_Extension_Pack-4.3.20-96996.vbox-extpack
echo "##############################################################################"
echo "\033[7;36m You need to set up the password 'pass', if you don't then you need to modify the conf file \033[0m"
echo "##############################################################################"
adduser --ingroup vboxusers vbox
wget 'http://downloads.sourceforge.net/project/phpvirtualbox/phpvirtualbox-4.3-1.zip' -O phpvirtualbox.zip
unzip phpvirtualbox.zip -d /var/www/html/
mv /var/www/html/phpvirtualbox-4.3-1 /var/www/html/vbox
mv -f config.php /var/www/html/vbox/config.php
mv -f virtualbox /etc/default/virtualbox
mv /var/www/html/index.html /var/www/html/def.html
