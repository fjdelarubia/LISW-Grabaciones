#!/bin/bash

directorio=$(pwd)

#Instalacion de las dependencias de los modulos
cd $directorio/almacenamiento/produccion
npm start &

cd $directorio/grabaciones/produccion
npm start &

cd $directorio/frontend/produccion
npm start &