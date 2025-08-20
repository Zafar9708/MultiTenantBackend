let departments = [
  'IT','NON-IT','Sales','IT Operation'
];

const getDepartments = () => departments;

const addDepartment = (newDept) => {
  if (!departments.includes(newDept)) {
    departments.push(newDept);
  }
  return departments;
};

module.exports = { getDepartments, addDepartment };
