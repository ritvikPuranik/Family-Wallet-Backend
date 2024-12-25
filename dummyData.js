// User data (for demonstration purposes)
const users = [
  { id: 1, username: 'user', password: 'password', isParent: true, address: 'axB10', familyId: 1 },
  { id: 2, username: 'user2', password: 'password', isParent: false, address: 'axB21', familyId: 1 },
  { id: 3, username: 'user3', password: 'password', isParent: false, address: 'axB32', familyId: 0 },
];


const transactions = [{
  id: 1,
  from: 1,
  to: 'axB21',
  amount: 100,
  date: new Date().toLocaleDateString(),
  purpose: 'Payment for services',
  status: 'completed'
},
{
  id: 2,
  from: 2,
  to: 'axB10',
  amount: 120,
  date: new Date().toLocaleDateString(),
  purpose: 'Payment for services',
  status: 'completed'
},
{
  id: 3,
  from: 3,
  to: 'axB21',
  amount: 10,
  date: new Date().toLocaleDateString(),
  purpose: 'testing',
  status: 'pending approval'
}]

module.exports = { users, transactions };