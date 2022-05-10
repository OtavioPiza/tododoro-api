/**
 * Router for task routes
 *
 * @version 1.0.0
 */

// == imports == //

/* libs */

const express = require('express');
const jwt = require('../utils/jwt');

/* middleware */

const tokenVerifier = require('../middleware/tokenVerifier');

/* models */

const Task = require('../models/task');
const User = require('../models/user');

// == routes == //

const taskRouter = express.Router();

/**
 * verifies if the request contains a valid token
 */
taskRouter.use(tokenVerifier);

/**
 * gets all tasks for a given user
 */
taskRouter.get('/', async (request, response) => {
  const token = jwt.decode(request.get('authorization'));
  return Task.find({ user: token.id }).then(tasks => response.status(200).send(tasks).end());
});

/**
 * creates a new task for a given user
 */
taskRouter.post('/', async (request, response) => {
  const body = request.body;

  if (!body || !('title' in body)) {
    response.status(400).send({ error: 'missing content' });
  }

  const token = jwt.decode(request.get('authorization'));
  const user = await User.findById(token.id);

  if (!user) {
    return response.send(401).send({ error: 'this user does not exist' });
  }

  const task = new Task({
    user: user.id,
    title: body.title,
    description: 'description' in body ? body.description : null,
    due: 'due' in body ? body.due : null,
    priority: 'priority' in body ? body.priority : null
  });

  return task
    .save()
    .then(task => response.status(201).send({
      id: task.id,
      title: task.title,
      description: task.description,
      due: task.due,
      priority: task.priority
    }).end())
    .catch(() => response.status(400).send({ error: 'Task validatiton failed' }).end());
});

/**
 * updates a given task for a given user
 */
taskRouter.put('/', async (request, response) => {
  const body = request.body;

  if (!body || !('id' in body)) {
    response.status(400).send({ error: 'missing content' });
    return;
  }

  const data = {
    title: 'title' in body ? body.title : null,
    description: 'description' in body ? body.description : null,
  };

  if (!('description' in body)) {
    delete data.description;
  }

  if (!('title' in body)) {
    delete data.title;
  }

  if (data) try {
    const token = jwt.decode(request.get('authorization'));
    await Task.findByIdAndUpdate(body.id, data).where({ user: token.id });

  } catch (e) {

    if (e.kind === 'ObjectId') {
      response.status(400).send({ error: 'invalid id' });
      return;
    }
    throw e;
  }
  response.status(204).end();
});

/**
 * deletes a given task for a given user
 */
taskRouter.delete('/', async (request, response) => {
  const body = request.body;

  if (!body || !('id' in body)) {
    response.send(400).send({ error: 'content missing' });
    return;
  }

  try {
    const token = jwt.decode(request.get('authorization'));
    await Task.findByIdAndDelete(body.id).where({ user: token.id });

  } catch (e) {

    if (e.kind === 'ObjectId') {
      response.status(400).send({ error: 'invalid id' });
      return;
    }
    throw e;
  }
  response.status(204).end();
});

// == exports == //

module.exports = taskRouter;
