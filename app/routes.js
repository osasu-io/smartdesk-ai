const Ticket = require('./models/ticket');
const axios = require('axios');

// === AI classification using DeepSeek ===
async function classifyWithDeepseek(description) {
  const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'Classify this IT issue into hardware, software, network, account, or general. Respond with only one word.' },
      { role: 'user', content: description }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  // Return the category in lowercase (e.g., "hardware")
  return response.data.choices[0].message.content.trim().toLowerCase();
}

module.exports = function(app, passport) {
  // === Middleware to protect routes (requires login) ===
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }

  // ──────────────── AUTH ROUTES ────────────────

  // Home page (login/signup options)
  app.get('/', (req, res) => res.render('index.ejs'));

  // Show login page with flash messages
  app.get('/login', (req, res) =>
    res.render('login.ejs', { message: req.flash('loginMessage') }));

  // Show signup page with flash messages
  app.get('/signup', (req, res) =>
    res.render('signup.ejs', { message: req.flash('signupMessage') }));

  // Log the user out and redirect to homepage
  app.get('/logout', (req, res) =>
    req.logout(() => res.redirect('/')));

  // Handle login form submit
  app.post('/login', passport.authenticate('local-login', {
    failureRedirect: '/login',
    failureFlash: true
  }), function(req, res) {
    // Redirect based on role
    if (req.user.local.email.includes('@admin.com') || req.user.local.email.includes('it@')) {
      res.redirect('/admin');
    } else {
      res.redirect('/profile');
    }
  });

  // Handle signup form submit
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }));

  // Show profile dashboard with user’s tickets
  app.get('/profile', isLoggedIn, async (req, res) => {
    const tickets = await Ticket.find({ createdBy: req.user._id });
    res.render('profile.ejs', { user: req.user, tickets });
  });

  // ──────────────── TICKET ROUTES ────────────────

  // Create new ticket — runs AI category classification before saving
  app.post('/tickets', isLoggedIn, async (req, res) => {
    try {
      const category = await classifyWithDeepseek(req.body.description);
      const newTicket = new Ticket({
        title: req.body.title,
        description: req.body.description,
        category,
        createdBy: req.user._id
      });
      await newTicket.save();
      res.redirect('/profile');
    } catch (err) {
      console.error('❌ Error creating ticket:', err);
      res.redirect('/profile');
    }
  });

  // View a single ticket
  app.get('/tickets/:id', isLoggedIn, async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy assignedTo messages.sender internalNotes.author');
    res.render('ticket.ejs', { ticket, user: req.user });
  });

  // Add a chat message to a ticket
  app.post('/tickets/:id/messages', isLoggedIn, async (req, res) => {
    await Ticket.findByIdAndUpdate(req.params.id, {
      $push: {
        messages: {
          sender: req.user._id,
          content: req.body.message
        }
      }
    });
    res.redirect(`/tickets/${req.params.id}`);
  });

  // Add internal (admin-only) note to a ticket
  app.post('/tickets/:id/internal-notes', isLoggedIn, async (req, res) => {
    const isAdmin = req.user.local.email.includes('@admin.com') || req.user.local.email.includes('it@');
    if (!isAdmin) return res.status(403).send('Forbidden');

    await Ticket.findByIdAndUpdate(req.params.id, {
      $push: {
        internalNotes: {
          author: req.user._id,
          content: req.body.note
        }
      }
    });
    res.redirect(`/tickets/${req.params.id}`);
  });

  // Admin updates ticket (status or assignee)
  app.post('/tickets/:id/update', isLoggedIn, async (req, res) => {
    try {
      const updates = { status: req.body.status };
      if (req.body.assignTo) updates.assignedTo = req.body.assignTo;
      await Ticket.findByIdAndUpdate(req.params.id, updates);
      res.redirect('/admin');
    } catch (err) {
      console.error(err);
      res.redirect('/admin');
    }
  });

  // Delete a ticket (by creator or admin)
  app.post('/tickets/:id/delete', isLoggedIn, async (req, res) => {
    try {
      const ticket = await Ticket.findById(req.params.id);
      if (ticket.createdBy.equals(req.user._id) || req.user.local.email.includes('@admin.com')) {
        await Ticket.findByIdAndDelete(req.params.id);
      }
      res.redirect('/profile');
    } catch (err) {
      console.error(err);
      res.redirect('/profile');
    }
  });

  // ──────────────── ADMIN DASHBOARD ────────────────

  // Admin dashboard shows all tickets
  app.get('/admin', isLoggedIn, async (req, res) => {
    // Only admins/IT allowed
    if (!req.user.local.email.includes('@admin.com') && !req.user.local.email.includes('it@')) {
      return res.status(403).send('Not authorized');
    }

    const tickets = await Ticket.find().populate('createdBy assignedTo');
    res.render('admin-dashboard.ejs', { tickets });
  });
};
