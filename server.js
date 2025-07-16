const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 6000;

app.use(express.json());

const users = {};

/*
 * API Request Body Formats
 * 
 * POST /users - Create new user
 * Request body format:
 * {
 *   "name": "John Doe",      // Required: string, cannot be empty
 *   "email": "john@example.com", // Required: string, must contain @, must be unique
 *   "age": 25               // Optional: positive integer
 * }
 * 
 * PUT /users/:id - Update user
 * Request body format (all fields optional):
 * {
 *   "name": "Jane Doe",      // Optional: string, cannot be empty if provided
 *   "email": "jane@example.com", // Optional: string, must contain @, must be unique if provided
 *   "age": 30               // Optional: positive integer
 * }
 */

/*
 * User class representing a user entity with CRUD operations
 * 
 * Properties:
 * - id: Unique UUID identifier (auto-generated)
 * - name: User's full name (required)
 * - email: User's email address (required, must be unique)
 * - age: User's age (optional, must be positive integer)
 * - created_at: ISO timestamp of user creation
 * - updated_at: ISO timestamp of last update
 */

class User {
    constructor(name, email, age = null) {
        this.id = uuidv4();
        this.name = name;
        this.email = email;
        this.age = age;
        this.created_at = new Date().toISOString();
        this.updated_at = new Date().toISOString();
    }

    toDict() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            age: this.age,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    update(name = null, email = null, age = null) {
        if (name !== null) {
            this.name = name;
        }
        if (email !== null) {
            this.email = email;
        }
        if (age !== null) {
            this.age = age;
        }
        this.updated_at = new Date().toISOString();
    }
}

function validateUserData(data, requireAll = true) {
    const errors = [];

    if (requireAll && !data.name) {
        errors.push('Name is required');
    } else if (data.name && !data.name.trim()) {
        errors.push('Name cannot be empty');
    }

    if (requireAll && !data.email) {
        errors.push('Email is required');
    } else if (data.email && !data.email.trim()) {
        errors.push('Email cannot be empty');
    } else if (data.email && !data.email.includes('@')) {
        errors.push('Invalid email format');
    }

    if (data.age !== undefined && data.age !== null) {
        const age = parseInt(data.age);
        if (isNaN(age) || age < 0) {
            errors.push('Age must be a positive number');
        }
    }

    return errors;
}

app.post('/users', (req, res) => {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No data provided' });
    }

    const errors = validateUserData(data);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    for (const user of Object.values(users)) {
        if (user.email === data.email) {
            return res.status(409).json({ error: 'Email already exists' });
        }
    }

    const user = new User(data.name, data.email, data.age);
    users[user.id] = user;

    res.status(201).json(user.toDict());
});

app.get('/users', (req, res) => {
    const userList = Object.values(users).map(user => user.toDict());
    res.status(200).json(userList);
});

app.get('/users/:userId', (req, res) => {
    const { userId } = req.params;
    const user = users[userId];
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user.toDict());
});

app.put('/users/:userId', (req, res) => {
    const { userId } = req.params;
    const user = users[userId];
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No data provided' });
    }

    const errors = validateUserData(data, false);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    if (data.email) {
        for (const [uid, u] of Object.entries(users)) {
            if (uid !== userId && u.email === data.email) {
                return res.status(409).json({ error: 'Email already exists' });
            }
        }
    }

    user.update(data.name, data.email, data.age);
    res.status(200).json(user.toDict());
});

app.delete('/users/:userId', (req, res) => {
    const { userId } = req.params;
    const user = users[userId];
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    delete users[userId];
    res.status(200).json({ message: 'User deleted successfully' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
