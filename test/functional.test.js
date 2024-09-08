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

describe('Functional Test for Logout Functionality', () => {
  it('should log out the user successfully', async () => {
    // Simulate a logged-in user by setting a session
    const agent = request.agent(app);

    // First, log in with valid credentials
    await agent.post('/user/login').send({
      usernameOrEmail: 'simpleUser',
      password: 'password',
    });

    // Then, attempt to log out
    const response = await agent.get('/user/logout');

    // Check if the response status code is 302, which indicates a redirect after logout
    expect(response.statusCode).toBe(302);
    // Check if redirected to the home page or login page
    expect(response.headers.location).toBe('/'); 
  });
});


