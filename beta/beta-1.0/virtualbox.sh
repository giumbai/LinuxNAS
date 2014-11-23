#!/bin/bash
#Version 1.0
#VirtualBox installer and PHP VirtualBox installer
wget -q https://www.virtualbox.org/download/oracle_vbox.asc -O- | sudo apt-key add -
apt-get install virtualbox-4.3
wget download.virtualbox.org/virtualbox/4.3.20/Oracle_VM_VirtualBox_Extension_Pack-4.3.20-96996.vbox-extpack
VBoxManage extpack install Oracle_VM_VirtualBox_Extension_Pack-4.3.20-96996.vbox-extpack
echo "\033[7;36mPassword is 'pass', if not you need to modify the conf file\033[0m"
adduser --ingroup vboxusers vbox
wget 'http://downloads.sourceforge.net/project/phpvirtualbox/phpvirtualbox-4.3-1.zip' -O phpvirtualbox.zip
unzip phpvirtualbox.zip -d /var/www/html/
mv /var/www/html/phpvirtualbox-4.3-1 /var/www/html/vbox
mv -f config.php /var/www/html/vbox/config.php
mv -f virtualbox /etc/default/virtualbox
mv /var/www/html/index.html /var/www/html/def.html
