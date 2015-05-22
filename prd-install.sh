#!/bin/bash

directorio=$(pwd)

#Instalacion de las dependencias de los modulos
cd $directorio/almacenamiento/produccion
npm install

cd $directorio/grabaciones/produccion
npm install

cd $directorio/frontend/produccion
npm install