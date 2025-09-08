const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const staticPath = path.join(__dirname, 'dist/ficct-scrum-frontend/browser');
app.use(express.static(staticPath));

app.get('/*', function(req, res) {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
