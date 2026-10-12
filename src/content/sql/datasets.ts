import type { SqlDataset } from '../schema';

// Original PrepForge datasets. Each has hidden variants that probe edge cases
// (NULLs, ties, empty groups, duplicates). Grading runs every variant.

const companySchema = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  dept_id INTEGER REFERENCES departments(id),
  manager_id INTEGER REFERENCES employees(id),
  salary INTEGER NOT NULL,
  hire_date TEXT NOT NULL
);`;

export const company: SqlDataset = {
  id: 'company',
  title: 'Company',
  description: 'Departments and employees with managers, salaries and hire dates.',
  schemaSql: companySchema,
  seedSql: `
INSERT INTO departments VALUES (1,'Engineering'),(2,'Sales'),(3,'Finance'),(4,'Legal');
INSERT INTO employees VALUES
 (1,'Asha',1,NULL,250000,'2018-03-12'),
 (2,'Ravi',1,1,180000,'2019-07-01'),
 (3,'Meera',1,1,180000,'2020-01-15'),
 (4,'Kabir',1,2,120000,'2022-06-20'),
 (5,'Nina',2,NULL,160000,'2017-11-05'),
 (6,'Omar',2,5,90000,'2021-02-28'),
 (7,'Priya',2,6,95000,'2023-04-10'),
 (8,'Tara',3,NULL,140000,'2016-09-30'),
 (9,'Vikram',3,8,110000,'2020-12-01'),
 (10,'Zoya',NULL,1,70000,'2024-01-08');`,
  hidden: [
    {
      id: 'ties-and-empty',
      purpose: 'Salary ties at the top, an empty department, and an employee without a department',
      seedSql: `
INSERT INTO departments VALUES (1,'Engineering'),(2,'Sales'),(5,'Research');
INSERT INTO employees VALUES
 (1,'A',1,NULL,300,'2020-01-01'),
 (2,'B',1,1,300,'2020-02-01'),
 (3,'C',1,1,200,'2021-01-01'),
 (4,'D',2,NULL,200,'2019-05-05'),
 (5,'E',2,4,100,'2022-12-31'),
 (6,'F',NULL,NULL,150,'2023-01-01');`,
    },
    {
      id: 'single-row',
      purpose: 'Only one employee (no "second" anything)',
      seedSql: `
INSERT INTO departments VALUES (1,'Solo');
INSERT INTO employees VALUES (1,'Only',1,NULL,1000,'2020-01-01');`,
    },
  ],
};

const shopSchema = `
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  signup_date TEXT NOT NULL
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('placed','shipped','cancelled'))
);
CREATE TABLE order_items (
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  qty INTEGER NOT NULL,
  PRIMARY KEY (order_id, product_id)
);`;

export const shop: SqlDataset = {
  id: 'shop',
  title: 'Shop',
  description: 'Customers, products, orders and order items for an online store.',
  schemaSql: shopSchema,
  seedSql: `
INSERT INTO customers VALUES
 (1,'Aarav','Pune','2023-01-10'),(2,'Diya','Mumbai','2023-02-14'),(3,'Ishaan',NULL,'2023-03-01'),
 (4,'Kiara','Pune','2023-05-20'),(5,'Rohan','Delhi','2024-01-05');
INSERT INTO products VALUES
 (1,'Keyboard','electronics',2500),(2,'Mouse','electronics',800),(3,'Notebook','stationery',120),
 (4,'Pen','stationery',30),(5,'Monitor','electronics',12000),(6,'Desk Lamp','home',1500),(7,'Webcam','electronics',3000);
INSERT INTO orders VALUES
 (101,1,'2024-01-03','shipped'),(102,1,'2024-02-11','shipped'),(103,2,'2024-02-11','cancelled'),
 (104,2,'2024-03-02','shipped'),(105,3,'2024-03-15','placed'),(106,4,'2024-03-20','shipped'),
 (107,1,'2024-04-01','placed');
INSERT INTO order_items VALUES
 (101,1,1),(101,2,2),(102,3,10),(102,4,5),(103,5,1),(104,5,1),(104,2,1),
 (105,3,3),(106,6,2),(107,1,1),(107,4,20);`,
  hidden: [
    {
      id: 'no-orders-and-ties',
      purpose: 'Customers and products with no orders, tied totals, only cancelled orders',
      seedSql: `
INSERT INTO customers VALUES (1,'P','X','2023-01-01'),(2,'Q',NULL,'2023-01-02'),(3,'R','Y','2023-01-03'),(4,'S','X','2023-01-04');
INSERT INTO products VALUES (1,'A','c1',100),(2,'B','c1',100),(3,'C','c2',50),(4,'D','c3',10);
INSERT INTO orders VALUES (1,1,'2024-05-01','shipped'),(2,2,'2024-05-01','shipped'),(3,3,'2024-05-02','cancelled');
INSERT INTO order_items VALUES (1,1,1),(2,2,1),(3,3,4);`,
    },
  ],
};

const eventsSchema = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL
);
CREATE TABLE logins (
  user_id INTEGER NOT NULL REFERENCES users(id),
  login_date TEXT NOT NULL
);`;

export const events: SqlDataset = {
  id: 'events',
  title: 'Events',
  description: 'Users and their daily logins (with repeated logins on the same day), for streak and retention questions.',
  schemaSql: eventsSchema,
  seedSql: `
INSERT INTO users VALUES (1,'Ana','IN'),(2,'Ben','US'),(3,'Chen','IN'),(4,'Dev','UK');
INSERT INTO logins VALUES
 (1,'2024-03-01'),(1,'2024-03-02'),(1,'2024-03-02'),(1,'2024-03-03'),(1,'2024-03-05'),
 (2,'2024-03-01'),(2,'2024-03-03'),(2,'2024-03-04'),(2,'2024-03-05'),(2,'2024-03-06'),
 (3,'2024-03-10'),
 (1,'2024-03-31'),(1,'2024-04-01');`,
  hidden: [
    {
      id: 'month-boundary',
      purpose: 'Streaks crossing a month boundary, duplicate logins, and a user who never logged in',
      seedSql: `
INSERT INTO users VALUES (1,'X','IN'),(2,'Y','IN'),(3,'Z','US');
INSERT INTO logins VALUES
 (1,'2024-01-30'),(1,'2024-01-31'),(1,'2024-02-01'),(1,'2024-02-01'),
 (2,'2024-02-28'),(2,'2024-02-29'),(2,'2024-03-01'),(2,'2024-03-02');`,
    },
  ],
};

const ridesSchema = `
CREATE TABLE drivers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  joined TEXT NOT NULL
);
CREATE TABLE riders (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);
CREATE TABLE trips (
  id INTEGER PRIMARY KEY,
  rider_id INTEGER NOT NULL REFERENCES riders(id),
  driver_id INTEGER REFERENCES drivers(id),
  city TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed','cancelled_by_rider','cancelled_by_driver','no_driver')),
  distance_km REAL,
  fare INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5)
);`;

export const rides: SqlDataset = {
  id: 'rides',
  title: 'Rides',
  description: 'A ride-hailing app: drivers, riders and trip requests with statuses, fares and optional ratings. driver_id is NULL when no driver accepted; fare is NULL unless the trip completed.',
  schemaSql: ridesSchema,
  seedSql: `
INSERT INTO drivers VALUES (1,'Arjun','Bengaluru','2022-04-01'),(2,'Bela','Bengaluru','2023-01-15'),(3,'Chirag','Pune','2021-09-10'),(4,'Divya','Pune','2024-02-20');
INSERT INTO riders VALUES (1,'Esha','Bengaluru'),(2,'Farhan','Bengaluru'),(3,'Gauri','Pune'),(4,'Harsh','Pune'),(5,'Isha','Bengaluru');
INSERT INTO trips VALUES
 (1,1,1,'Bengaluru','2024-03-01 08:15:00','completed',12.5,320,5),
 (2,2,1,'Bengaluru','2024-03-01 09:40:00','completed',4.0,110,4),
 (3,1,2,'Bengaluru','2024-03-01 18:05:00','cancelled_by_driver',NULL,NULL,NULL),
 (4,3,3,'Pune','2024-03-01 19:30:00','completed',8.2,210,NULL),
 (5,5,NULL,'Bengaluru','2024-03-02 07:55:00','no_driver',NULL,NULL,NULL),
 (6,2,2,'Bengaluru','2024-03-02 08:20:00','completed',15.0,400,3),
 (7,4,3,'Pune','2024-03-02 10:10:00','cancelled_by_rider',NULL,NULL,NULL),
 (8,4,4,'Pune','2024-03-02 10:25:00','completed',6.5,180,5),
 (9,1,1,'Bengaluru','2024-03-03 08:05:00','completed',12.0,310,4),
 (10,3,4,'Pune','2024-03-03 21:45:00','completed',20.0,520,4),
 (11,5,2,'Bengaluru','2024-03-03 23:10:00','cancelled_by_rider',NULL,NULL,NULL),
 (12,2,1,'Bengaluru','2024-03-04 09:00:00','completed',5.5,150,5),
 (13,1,2,'Bengaluru','2024-03-04 18:30:00','completed',9.0,260,2),
 (14,3,3,'Pune','2024-03-04 08:45:00','completed',7.0,190,4),
 (15,4,NULL,'Pune','2024-03-04 22:15:00','no_driver',NULL,NULL,NULL),
 (16,5,1,'Bengaluru','2024-04-01 08:00:00','completed',11.0,300,5);`,
  hidden: [
    {
      id: 'cancel-heavy-and-unrated',
      purpose: 'A day where every trip is cancelled, a driver with no ratings, a rider with no trips, and fare ties',
      seedSql: `
INSERT INTO drivers VALUES (1,'P','X','2022-01-01'),(2,'Q','X','2022-01-01'),(3,'R','Y','2023-01-01');
INSERT INTO riders VALUES (1,'S','X'),(2,'T','X'),(3,'U','Y');
INSERT INTO trips VALUES
 (1,1,1,'X','2024-05-01 10:00:00','completed',5,200,NULL),
 (2,2,2,'X','2024-05-01 11:00:00','completed',5,200,NULL),
 (3,1,1,'X','2024-05-02 09:00:00','cancelled_by_driver',NULL,NULL,NULL),
 (4,2,2,'X','2024-05-02 09:30:00','cancelled_by_rider',NULL,NULL,NULL),
 (5,1,1,'X','2024-05-03 23:59:59','completed',3,90,1),
 (6,2,1,'X','2024-05-04 00:00:00','completed',3,90,5);`,
    },
  ],
};

const socialSchema = `
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  joined TEXT NOT NULL
);
CREATE TABLE follows (
  follower_id INTEGER NOT NULL REFERENCES users(id),
  followee_id INTEGER NOT NULL REFERENCES users(id),
  followed_at TEXT NOT NULL,
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  posted_at TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  reply_to INTEGER REFERENCES posts(id)
);`;

export const social: SqlDataset = {
  id: 'social',
  title: 'Social',
  description: 'Users, who follows whom (directed), and posts with likes; reply_to links a reply to its parent post, forming threads.',
  schemaSql: socialSchema,
  seedSql: `
INSERT INTO users VALUES (1,'ana','2023-01-05'),(2,'bo','2023-02-10'),(3,'cy','2023-03-15'),(4,'di','2023-06-01'),(5,'ed','2024-01-20'),(6,'fy','2024-02-02');
INSERT INTO follows VALUES
 (1,2,'2023-02-11'),(2,1,'2023-02-12'),(1,3,'2023-03-20'),(3,1,'2023-04-01'),(2,3,'2023-05-05'),
 (4,1,'2023-06-02'),(5,1,'2024-01-21'),(5,2,'2024-01-22'),(4,2,'2023-07-07'),(3,4,'2023-08-08');
INSERT INTO posts VALUES
 (1,1,'2024-03-01 09:00:00',40,NULL),
 (2,2,'2024-03-01 10:00:00',12,1),
 (3,3,'2024-03-01 11:30:00',5,2),
 (4,1,'2024-03-02 08:00:00',25,NULL),
 (5,6,'2024-03-02 12:00:00',0,4),
 (6,2,'2024-03-03 15:00:00',18,NULL),
 (7,5,'2024-03-03 16:00:00',3,1),
 (8,1,'2024-03-04 09:30:00',7,3),
 (9,3,'2024-03-05 20:00:00',30,NULL);`,
  hidden: [
    {
      id: 'isolated-and-deep',
      purpose: 'A user with no follows or posts, one-way follows only, ties in likes, and a deeper reply chain',
      seedSql: `
INSERT INTO users VALUES (1,'u1','2023-01-01'),(2,'u2','2023-01-01'),(3,'u3','2023-01-01'),(4,'u4','2023-01-01');
INSERT INTO follows VALUES (1,2,'2023-02-01'),(2,3,'2023-02-01'),(3,2,'2023-02-02');
INSERT INTO posts VALUES
 (1,2,'2024-01-01 00:00:00',10,NULL),(2,3,'2024-01-01 01:00:00',10,1),(3,2,'2024-01-01 02:00:00',1,2),
 (4,3,'2024-01-01 03:00:00',0,3),(5,1,'2024-01-02 00:00:00',10,NULL);`,
    },
  ],
};

const ledgerSchema = `
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY,
  owner TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('savings','current')),
  opened TEXT NOT NULL
);
CREATE TABLE txns (
  id INTEGER PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  txn_date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT
);`;

export const ledger: SqlDataset = {
  id: 'ledger',
  title: 'Ledger',
  description: 'Bank accounts and their transactions. Positive amounts are credits, negative amounts debits; category may be NULL.',
  schemaSql: ledgerSchema,
  seedSql: `
INSERT INTO accounts VALUES (1,'Kavya','savings','2023-12-01'),(2,'Laksh','current','2024-01-10'),(3,'Mira','savings','2024-02-15'),(4,'Neel','current','2024-03-01');
INSERT INTO txns VALUES
 (1,1,'2024-01-01',5000,'salary'),(2,1,'2024-01-05',-1200,'rent'),(3,1,'2024-01-20',-300,'food'),
 (4,1,'2024-02-01',5000,'salary'),(5,1,'2024-02-03',-1200,'rent'),(6,1,'2024-02-14',-2500,'travel'),
 (7,2,'2024-01-15',2000,'transfer'),(8,2,'2024-01-16',-2500,'shopping'),(9,2,'2024-02-01',1000,NULL),
 (10,2,'2024-02-20',-400,'food'),(11,3,'2024-02-20',800,'salary'),(12,3,'2024-03-01',-100,'food'),
 (13,1,'2024-03-01',5000,'salary'),(14,3,'2024-03-05',-50,NULL);`,
  hidden: [
    {
      id: 'same-day-and-empty',
      purpose: 'Three transactions on one day (also the latest day for that account), an account with no transactions, a balance that returns to exactly 0, and a month with no activity',
      seedSql: `
INSERT INTO accounts VALUES (1,'A','savings','2024-01-01'),(2,'B','current','2024-01-01'),(3,'C','savings','2024-01-01');
INSERT INTO txns VALUES
 (1,1,'2024-01-10',100,'x'),(2,1,'2024-01-10',-100,'y'),(3,1,'2024-01-10',50,NULL),
 (4,2,'2024-01-31',-10,'z'),(5,2,'2024-03-31',10,'z');`,
    },
  ],
};

export const datasets: SqlDataset[] = [company, shop, events, rides, social, ledger];
