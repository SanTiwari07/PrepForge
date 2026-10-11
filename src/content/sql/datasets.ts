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
 (4,'Pen','stationery',30),(5,'Monitor','electronics',12000),(6,'Desk Lamp','home',1500);
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

export const datasets: SqlDataset[] = [company, shop, events];
