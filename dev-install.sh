#!/bin/bash

directorio=$(pwd)

#Instalacion de las dependencias de los modulos
cd $directorio/almacenamiento/desarrollo
npm install

cd $directorio/grabaciones/desarrollo
npm install

cd $directorio/frontend/desarrollo
npm install