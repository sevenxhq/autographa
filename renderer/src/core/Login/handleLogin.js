import * as localforage from 'localforage';
import { handleJson } from './handleJson';
import * as logger from '../../logger';

export const createUser = (values, fs) => {
  logger.debug('handleLogin.js', 'In createUser to create a new user');
  const obj = {
    username: values.username,
    firstname: '',
    lastname: '',
    email: '',
    organization: '',
    selectedregion: '',
    lastSeen: new Date(),
    isArchived: false,
  };
  return handleJson(obj, fs).then(() => obj);
};

/**
 * It writes the users to a file.
 * @param users - [{
 */
export const writeToFile = (users) => {
  try {
    const newpath = localStorage.getItem('userPath');
    const fs = window.require('fs');
    const path = require('path');
    const file = path.join(newpath, 'autographa', 'users', 'users.json');
    fs.promises.writeFile(file, JSON.stringify(users));
  } catch (err) {
    logger.debug('handleLogin.js', 'Error saving users to disk');
  }
};

/**
 * It takes an array of users and a username and returns the user object if the username is found in
 * the array.
 * @param users - [{username: 'test', password: 'test', lastSeen: '2019-01-01'}]
 * @param values - {
 * @returns The user object.
 */
export const handleLogin = async (users, values) => {
  if (!users) { return null; }
  const user = users.find((u) => u.username === values.username);
  if (!user) { return null; }

  user.lastSeen = new Date();
  await Promise.all([
    writeToFile(users),
    localforage.setItem('users', users),
  ]);
  return user;
};
