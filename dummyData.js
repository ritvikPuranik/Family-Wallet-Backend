// User data (for demonstration purposes)
const users = [
  { id: 1, username: 'user', password: 'password', isParent: true, familyId: 1 },
  { id: 2, username: 'user2', password: 'password', isParent: false, familyId: 1 },
  { id: 3, username: 'user3', password: 'password', isParent: false, familyId: 0 },
];


const transactions = [{
  id: 1,
  payor: 1,
  from: 'axB10',
  to: 'axB21',
  amount: 100,
  date: new Date().toLocaleDateString(),
  purpose: 'Payment for services',
  status: 'completed'
},
{
  id: 2,
  payor: 2,
  from: 'axB21',
  to: 'axB10',
  amount: 120,
  date: new Date().toLocaleDateString(),
  purpose: 'Payment for services',
  status: 'completed'
},
{
  id: 3,
  payor: 3,
  from: 'axB32',
  to: 'axB21',
  amount: 10,
  date: new Date().toLocaleDateString(),
  purpose: 'testing',
  status: 'pending approval'
}]

module.exports = { users, transactions };