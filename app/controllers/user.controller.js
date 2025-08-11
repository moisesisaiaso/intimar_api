exports.allAccess = (req, res) => {
  res.status(200).json({message : "Public Content."});
};
  
exports.userBoard = (req, res) => {
  res.status(200).json({ message: "User Content."});
};
  
exports.adminBoard = (req, res) => {
  res.status(200).json({message: "Admin Content."});
};
  
exports.receptionistBoard = (req, res) => {
  res.status(200).json({message: "Receptionist Content."});
};

exports.hostBoard = (req, res) => {
  res.status(200).json({message: "Host Content."});
};

exports.vigilantBoard = (req, res) => {
  res.status(200).json({message: "Vigilant Content."});
};

exports.waiterBoard = (req, res) => {
  res.status(200).json({message: "Waiter Content."});
};