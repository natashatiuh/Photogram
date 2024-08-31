CREATE TABLE `auth_credentials` (
  `userId` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `dateOfRegistration` datetime NOT NULL,
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `email` (`email`))


  CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `dateOfBirth` date NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `bio` varchar(255) DEFAULT NULL,
  `followers` int DEFAULT NULL,
  `followings` int DEFAULT NULL,
  `posts` int DEFAULT NULL,
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `userName` (`userName`))


  CREATE TABLE `photos` (
  `id` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `likes` int DEFAULT NULL,
  `markedUsers` tinyint(1) DEFAULT NULL,
  `archived` tinyint(1) DEFAULT NULL,
  `sharings` int DEFAULT NULL,
  `savings` int DEFAULT NULL,
  `dateOfPublishing` datetime NOT NULL,
  UNIQUE KEY `id` (`id`))


CREATE TABLE `follows` (
  `followerId` varchar(255) NOT NULL,
  `followedId` varchar(255) NOT NULL,
  `followDate` datetime NOT NULL)


  CREATE TABLE `videos` (
  `id` varchar(255) NOT NULL,
  `userId` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `likes` int DEFAULT NULL,
  `markedUsers` tinyint(1) DEFAULT NULL,
  `archieved` tinyint(1) DEFAULT NULL,
  `sharings` int DEFAULT NULL,
  `savings` int DEFAULT NULL,
  `dateOfPublishing` datetime NOT NULL,
  UNIQUE KEY `id` (`id`))


  CREATE TABLE `likes` (
  `id` varchar(255) NOT NULL,
  `contentId` varchar(255) NOT NULL,
  `likedBy` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  UNIQUE KEY `id` (`id`))


  CREATE TABLE `marked_users` (
  `userId` varchar(255) NOT NULL,
  `contentId` varchar(255) NOT NULL)


  CREATE TABLE `saved_content` (
  `id` varchar(255) NOT NULL,
  `contentId` varchar(255) NOT NULL,
  `saverId` varchar(255) NOT NULL,
  UNIQUE KEY `id` (`id`))