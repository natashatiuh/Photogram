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


  CREATE TABLE `posts` (
  `id` varchar(255) NOT NULL,
  `type` enum('photo','video') NOT NULL,
  `userId` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `likes` int DEFAULT NULL,
  `markedUsers` tinyint(1) DEFAULT NULL,
  `archived` tinyint(1) DEFAULT NULL,
  `views`int DEFAULT NULL,
  `sharings` int DEFAULT NULL,
  `savings` int DEFAULT NULL,
  `dateOfPublishing` datetime NOT NULL,
  UNIQUE KEY `id` (`id`))


CREATE TABLE `follows` (
  `followerId` varchar(255) NOT NULL,
  `followedId` varchar(255) NOT NULL,
  `followDate` datetime NOT NULL)


  CREATE TABLE `likes` (
  `id` varchar(255) NOT NULL,
  `postId` varchar(255) NOT NULL,
  `likedBy` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  UNIQUE KEY `id` (`id`))


  CREATE TABLE `marked_users` (
  `userId` varchar(255) NOT NULL,
  `postId` varchar(255) NOT NULL)


  CREATE TABLE `saved_content` (
  `id` varchar(255) NOT NULL,
  `postId` varchar(255) NOT NULL,
  `saverId` varchar(255) NOT NULL,
  UNIQUE KEY `id` (`id`))

  CREATE TABLE `chats` (
    `id` varchar(255) NOT NULL,
    `type` enum('one-to-one','group') NOT NULL,
    `name` varchar(255) DEFAULT NULL,
    `cover` varchar(255) DEFAULT NULL,
    `creatorId` varchar(255) DEFAULT NULL,
    `user1` varchar(255) DEFAULT NULL,
    `user2` varchar(255) DEFAULT NULL,
    `createdAt` datetime NOT NULL
  )

  CREATE TABLE `messages` (
    `id` varchar(255) NOT NULL,
    `chatId` varchar(255) NOT NULL,
    `senderId` varchar(255) NOT NULL,
    `type` enum('text','photo','video','shared_post') NOT NULL,
    `textContent` varchar(255) DEFAULT NULL,
    `mediaURL` varchar(255) DEFAULT NULL,
    `sharedPostId` varchar(255) DEFAULT NULL,
    `sentAt` datetime NOT NULL
  )

  CREATE TABLE `group_chats_participants` (
    `participantId` varchar(255) NOT NULL,
    `chatId` varchar(255) NOT NULL,
    `creatorId` varchar(255) NOT NULL
  )