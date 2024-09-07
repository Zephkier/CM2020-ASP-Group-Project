const request = require('supertest');
const express = require('express');
const session = require('express-session');
const userRouter = require('../routes/user-router');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);
app.use('/user', userRouter);

describe('Simplified Integration Test for User Registration and Login', () => {
  it('should register a new user and log in successfully', async () => {
    const agent = request.agent(app);

    // Register a new user
    const registrationResponse = await agent.post('/user/register').send({
      username: 'testUserSimplified',
      email: 'testUserSimplified@example.com',
      password: 'password123',
      role: 'student',
    });

    // Check registration response status code
    expect(registrationResponse.statusCode).toBe(302);
    expect(registrationResponse.headers.location).toBe('/user/login');

    // Log in with the newly registered user
    const loginResponse = await agent.post('/user/login').send({
      usernameOrEmail: 'testUserSimplified',
      password: 'password123',
    });

    // Check login response status code
    expect(loginResponse.statusCode).toBe(302);
    expect(loginResponse.headers.location).toBe('/user/profile');
  });
});


