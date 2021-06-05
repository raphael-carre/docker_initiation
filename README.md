Docker avec Node.JS/Express et MongoDb
======================================

L'intégralité de cette documentation est basée sur la vidéo [Learn Docker - DevOps with Node.JS & Express](https://www.youtube.com/watch?v=9zUHg7xjIqQ&t=7920s) de [Sanjeev Thiyagarajan](https://www.youtube.com/channel/UC2sYgV-NV6S5_-pqLGChoNQ) et publiée le 29 avril 2021 sur la chaîne YouTube [freeCodeCamp.org](https://www.youtube.com/channel/UC8butISFwT-Wl7EV0hUK0BQ), et reflète l'ensemble des notes que j'ai pris durant le visionnage de cette vidéo. Un gros merci à lui pour ce travail titanesque et la qualité de son cours !  

> Le code présent dans ce dépôt n'est ici qu'à titre d'exemple. Il est préférable de partir de zéro pour s'entrainer à utiliser Docker.  

Dockerfile
----------

> Partons du principe qu'un projet est déjà initialisé (npm init), qu'il contient au moins un fichier 'index.js' avec un serveur Express minimaliste configuré, et que Docker est installé sur la machine.  

Créer un fichier 'Dockerfile' à la racine du projet, avec un contenu du type suivant :

    FROM node:14.17.0
    WORKDIR /app
    COPY package.json .
    RUN npm install
    COPY . ./
    ENV PORT 3000
    EXPOSE $PORT
    CMD ["npm", "run", "dev"]

Ajouter un fichier '.dockerignore' contenant la liste des fichiers à ignorer (Dockerfile, node_modules, .git, .gitignore, .env, etc...).

> L'instruction 'CMD' dépend du/des script(s) inclus dans 'package.json'

    CMD ["npm", "start"]

ou

    CMD ["node", "index.js"]

ou encore

    CMD ["nodemon", "index.js"]

sont tout à fait possibles !

***

Commandes
---------

### Créer l'image du container :

Créé l'image à partir du fichier 'Dockerfile'.
    
    docker build -t node-app-image .

> -t -> pour définir le nom de l'image  

> . -> répertoire ou se trouve le Dockerfile qui definit l'image  

### Lancer un container à partir de l'image :

    docker run -v $PWD:/app:ro --env-file ./.env -d -p 3000:4000 --name node-app node-app-image

En version légèrement raccourcie :

    docker run -v $PWD:/app:ro -e PORT 4000 -dp 3000:4000 --name node-app node-app-image

> -v $PWD:/app -> definit le volume à synchroniser et sa destination dans le container  

> :ro -> read only (empêche l'écriture de fichiers depuis le container)  

> --env ou -e -> permet de defnir une variable d'environnement  

> --env-file -> permet de passer un fichier de variables d'environnement  

> -d -> mode détaché (pour continuer à utiliser le terminal)  

> -p 3000:4000 -> definit le port du localhost mappé sur le port du container  

> --name -> permet de spécifier un nom au container  

### Supprimer le container:

    docker rm node-app -fv

> -f -> force la suppression du container lorsqu'il est toujours actif  

> -v -> supprime le volume associé au container (attention: on peut vouloir garder les volumes persistés comme ceux des bases de données !)  

### Acces au container :

    docker exec -it node-app bash

> -it -> mode interactif  

> bash -> pour lancer la commande bash dans le container  

### Liste des containers actifs :

    docker ps

> -a -> permet de voir tous les conteneurs actifs ou ceux ayant été fermés récement  

### Voir les logs d'un container :

    docker logs node-app

### Afficher les volumes

    docker volume ls

### Suppression des volumes

La commande suivante permet de supprimer tous les volumes des containers non-actifs.

    docker volume prune

> Attention: cette commande est dangereuse si on veux garder certains volumes persistant les bases de données par exemple.

***

docker compose
--------------
Créer un fichier 'docker-compose.yml' à la racine du projet.  
L'équivalent de la commande 'docker run ...' présentée plus haut est codée comme suit, sachant qu'il peut y avoir plusieurs services :

    version: "3"
    services:
        node-app:
            build: .
            ports:
                - "3000:4000"
            volumes:
                - ./:/app:ro
                - /app/node_modules
            # environment: 
            #     - PORT=3000
            env_file: 
                - ./.env

Lancer la commande suivante pour lancer le container (build optionnel)

    docker compose up -d --build

La commande suivante, ferme et supprime le conteneur et ses volumes

    docker compose down -v

***

Pour créer deux containers (un dev, un prod) à partir de la même source, créer un fichier 'docker-compose.yml' avec les instructions de base.

    version: "3"
    services:
        node-app:
            build: .
            ports:
                - "3000:4000"
            env_file: 
                - ./.env

Puis créer un fichier pour chaque type de container.  
#### Dev (docker-compose.dev.yml) :

    version: "3"
    services:
        node-app:
            build:
                context: .
                args: 
                    NODE_ENV: development
            volumes:
                - ./:/app:ro
                - /app/node_modules
            environment: 
                - NODE_ENV=development
            command: npm run dev

#### Prod (docker-compose.prod.yml) :

    version: "3"
    services:
        node-app:
            build:
                context: .
                args: 
                    NODE_ENV: production
            environment: 
                - NODE_ENV=production
            command: npm start

> On peut voir qu'il existe un paramètre "context" qui overwrite le paramètre "build" du premier fichier.  

> Il y a égalament un paramètre "args" et un sous-paramètre "NODE_ENV" qui provient du fichier "Dockerfile" modifié en conséquence.  

> La commande "command" overwrite la commande "CMD" du "Dockerfile".

    FROM node:14.17.0
    WORKDIR /app
    COPY package.json .
    ARG NODE_ENV
    RUN if [ "$NODE_ENV" = "development" ]; \
            then npm install; \
            else npm install --only=production; \
        fi
    COPY . ./
    ENV PORT 4000
    EXPOSE $PORT
    CMD ["npm", "start"]

> La commande "RUN" a été changée pour un script Bash permettant de vérifier la valeur de la variable "NODE_ENV" passée en argument dans les fichiers "docker-compose", ceci afin d'éviter d'installer les modules spécifiques à l'environnement de développement (ex: nodemon) lorsqu'on build le container de production.  

> A noter : il faut ajouter 'docker-compose*' à la liste des fichiers de ".dockerignore"

Pour lancer le container de développement, executer :

    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

> le flag '--build' n'est à utiliser que la première fois pour prendre en compte les nouvelles instructions du 'Dockerfile', si il y en a.  

> -f -> permet de charger un fichier de configuration spécifique.

Pour lancer le container de production, executer :

    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

***

Utiliser un second service - MongoDb
--------------------------------------

Modifier le fichier "docker-compose.yml" pour ajouter un nouveau service.

    version: "3"
    services:
        node-app:
            build: .
            ports:
                - "3000:4000"
            env_file: 
                - ./.env
            depends_on:
                - mongo

        mongo:
            image: mongo
            environment: 
                - MONGO_INITDB_ROOT_USERNAME=username
                - MONGO_INITDB_ROOT_PASSWORD=password

> On ne customise pas l'image donc on la récupère directement via le paramètre "image" suivi du nom de l'image.  

> MongoDb a besoin de deux variables d'environnement pour le nom d'utilisateur et le mot de passe.  

> Le paramètre 'depends_on' permet de faire démarrer le container indiqué en premier, ici 'mongo', afin d'éviter des erreurs potentielles au démarrage de l'application 'node-app'.  
**Attention**: cela ne dispense pas d'implémenter une logique afin de refaire un essai si la connexion à l'application du second container a échoué !

On lance ensuite la commande pour build les containers.

***

### MongoDb

On se connecte au container avec la commande suivante :

    docker exec -it 'nom_du_container' bash

Ensuite, pour se connecter à l'instance de MongoDb, saisir

    mongo -u "username" -p "password"

Liste des commandes de MongoDb :
> db : affiche le nom de la base de donnée actuelle  

> use mydb : créé une nouvelle base de donnée "mydb" et switch sur celle-ci  

> show dbs : affiche la liste des bases (celles qui contiennent des données uniquement !)  

Exemple d'instruction pour créer une entrée dans la base actuelle :

    db.books.insert({"name": "Harry Potter"})

> Créé une nouvelle entrée dans la collection "books" de la base "mydb".

Instruction pour rechercher les éléments dans la base :

    db.books.find()

> Retourne tous les enregistrements dans la collection "books".

Pour se connecter directement à MongoDb dans le container sans passer par le bash, il suffit de faire :

    docker exec -it 'nom_du_container' mongo -u "username" -p "password"

Malheureusement, les données ne restent pas en mémoire après la fermeture du container...

### Persistence des données

Ajouter un volume nommé au service "mongo" dans "docker-compose.yml"

    volumes:
        - mongo-db:/data/db

Pour éviter un conflit de noms de volumes entre les containers, il faut déclarer le nom dans "docker-compose.yml".  
A la racine du fichier, ajouter :

    volumes:
        mongo-db:

> Attention: lors de la fermeture et de la suppression du container avec la commande 'docker compose down', veiller à ne pas mettre le flag '-v' pour éviter de supprimer le volume de la base de données !!

### Connexion à la base de donnée du container

L'instruction de connexion nécessite le 'username', le 'password', mais aussi l'adresse ip (et le port) de la base, en l'occurence ici, du container.  
Pour trouver le port, il suffit de voir quel port est associé à la base avec :

    docker ps

Pour l'adresse ip, l'instruction suivante permet d'avoir des informations détaillées sur le container, notament dans la section 'Networks' pour ce qui nous interresse :

    docker inspect nom_du_container

L'adresse de connection à MongoDb sera donc :

    mongodb://username:password@adresse-ip:port/mydb?authSource=admin

Mais il y a plus simple, car l'adresse ip peut changer...  
Comme les containers sont dans le même network (créé lors du 'docker compose up'), on peut y faire référence par leur nom.  
Le nom du container dans notre exemple étant 'mongo', l'adresse devient donc:

    mongodb://username:password@mongo:port/mydb?authSource=admin

> Attention: récupérer l'adresse via le nom du service ne fonctionne que pour les networks que nous créons, pas sur les networks par défaut !

***

Afficher les différents networks :

    docker network ls

Pour avoir plus d'information sur un network spécifique :

    docker network inspect nom_du_network