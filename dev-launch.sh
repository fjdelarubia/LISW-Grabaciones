#!/bin/bash

directorio=$(pwd)

#Instalacion de las dependencias de los modulos
cd $directorio/almacenamiento/desarrollo
npm start &

cd $directorio/grabaciones/desarrollo
npm start &

cd $directorio/frontend/desarrollo
npm start &