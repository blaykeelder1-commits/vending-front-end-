import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { authAPI, vendorAPI, customerAPI } from './services/api';
import './App.css';

// ============================================
// VENDOR COMPONENTS
// ============================================

function VendorLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = isLogin
        ? { email, password }
        : { email, password, fullName };

      const response = isLogin
        ? await authAPI.vendorLogin(data)
        : await authAPI.vendorRegister(data);

      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('userType', 'vendor');
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Vendor {isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
              required
            />
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
        </button>
      </p>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/" style={{ color: '#007bff' }}>Back to Home</Link>
      </p>
    </div>
  );
}

function VendorDashboard() {
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading machines and products...');
      const [machinesRes, productsRes] = await Promise.all([
        vendorAPI.getMachines(),
        vendorAPI.getProducts()
      ]);
      console.log('Machines response:', machinesRes.data);
      console.log('Products response:', productsRes.data);
      setMachines(machinesRes.data.data.machines);
      setProducts(productsRes.data.data.products);
    } catch (err) {
      console.error('Error loading data:', err);
      console.error('Full error:', err.response || err);
      alert('Error loading data: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/vendor/login');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Vendor Dashboard</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Machines Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Vending Machines ({machines.length})</h2>
          <button onClick={() => setShowMachineForm(!showMachineForm)} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
            {showMachineForm ? 'Cancel' : 'Add Machine'}
          </button>
        </div>

        {showMachineForm && <MachineForm onSuccess={() => { setShowMachineForm(false); loadData(); }} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {machines.map(machine => (
            <div key={machine.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
              <h3>{machine.machine_name}</h3>
              <p><strong>Location:</strong> {machine.location}</p>
              <p><strong>Status:</strong> {machine.is_active ? '✅ Active' : '❌ Inactive'}</p>
              <p style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>QR: {machine.qr_code_data?.substring(0, 30)}...</p>
              <Link to={`/vendor/machines/${machine.id}`} style={{ color: '#007bff' }}>View Details</Link>
            </div>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Products ({products.length})</h2>
          <button onClick={() => setShowProductForm(!showProductForm)} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
            {showProductForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>

        {showProductForm && <ProductForm onSuccess={() => { setShowProductForm(false); loadData(); }} />}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {products.map(product => (
            <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
              <h3>{product.product_name}</h3>
              <p><strong>Price:</strong> ${product.price}</p>
              <p><strong>Category:</strong> {product.category || 'N/A'}</p>
              <p><strong>Status:</strong> {product.is_active ? '✅ Active' : '❌ Inactive'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MachineForm({ onSuccess }) {
  const [machineName, setMachineName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log('Creating machine...', { machineName, location });
      const response = await vendorAPI.createMachine({ machineName, location });
      console.log('Machine created:', response.data);
      setMachineName('');
      setLocation('');
      alert('Machine created successfully!');
      onSuccess();
    } catch (err) {
      console.error('Error creating machine:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create machine';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8f9fa', padding: '20px', marginTop: '10px', borderRadius: '5px' }}>
      <h3>Add New Machine</h3>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Machine Name"
          value={machineName}
          onChange={(e) => setMachineName(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
          required
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
          required
        />
      </div>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
        Create Machine
      </button>
    </form>
  );
}

function ProductForm({ onSuccess }) {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await vendorAPI.createProduct({ productName, price: parseFloat(price), category });
      setProductName('');
      setPrice('');
      setCategory('');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8f9fa', padding: '20px', marginTop: '10px', borderRadius: '5px' }}>
      <h3>Add New Product</h3>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
          required
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
          required
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
        Create Product
      </button>
    </form>
  );
}

function MachineDetails() {
  return <div style={{ padding: '20px' }}>
    <h2>Machine Details</h2>
    <Link to="/vendor/dashboard">Back to Dashboard</Link>
  </div>;
}

// ============================================
// CUSTOMER COMPONENTS
// ============================================

function CustomerQRLogin() {
  const [qrData, setQrData] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authAPI.customerQRLogin({ qrData });
      localStorage.setItem('token', response.data.data.sessionToken);
      localStorage.setItem('userType', 'customer');
      navigate('/customer/products');
    } catch (err) {
      setError(err.response?.data?.message || 'QR login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Customer QR Login</h2>
      <p>Scan the QR code on your vending machine or paste the QR data below:</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <textarea
            placeholder="Paste QR code data here"
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            style={{ width: '100%', padding: '8px', minHeight: '100px' }}
            required
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          Login with QR
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/" style={{ color: '#007bff' }}>Back to Home</Link>
      </p>
    </div>
  );
}

function CustomerProducts() {
  const [machineData, setMachineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMachine();
  }, []);

  const loadMachine = async () => {
    try {
      const response = await customerAPI.getMachine();
      setMachineData(response.data.data);
    } catch (err) {
      console.error('Error loading machine:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/customer/login');
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>{machineData?.machine?.machine_name}</h1>
          <p>{machineData?.machine?.location}</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <Link to="/customer/polls" style={{ marginRight: '15px', color: '#007bff' }}>View Polls</Link>
        <Link to="/customer/loyalty" style={{ color: '#007bff' }}>Loyalty Points</Link>
      </div>

      <h2>Available Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {machineData?.products?.map(product => (
          <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>{product.product_name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Slot:</strong> {product.slot_number}</p>
            <p><strong>Stock:</strong> {product.stock_quantity}</p>
            {product.category && <p><strong>Category:</strong> {product.category}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerPolls() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPolls();
  }, []);

  const loadPolls = async () => {
    try {
      const response = await customerAPI.getPolls();
      setPolls(response.data.data.polls);
    } catch (err) {
      console.error('Error loading polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    try {
      await customerAPI.votePoll(pollId, { pollOptionId: optionId });
      loadPolls();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to vote');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Product Polls</h1>
      <Link to="/customer/products" style={{ color: '#007bff' }}>Back to Products</Link>

      <div style={{ marginTop: '20px' }}>
        {polls.length === 0 ? (
          <p>No active polls at this time.</p>
        ) : (
          polls.map(poll => (
            <div key={poll.id} style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', borderRadius: '5px' }}>
              <h3>{poll.question}</h3>
              {poll.hasVoted ? (
                <div>
                  <p style={{ color: '#28a745', fontWeight: 'bold' }}>✓ You have voted</p>
                  <div>
                    {poll.options.map(option => (
                      <div key={option.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                        <div>{option.option_text}</div>
                        <div style={{ fontSize: '14px', color: '#666' }}>Votes: {option.vote_count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {poll.options.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleVote(poll.id, option.id)}
                      style={{ display: 'block', width: '100%', padding: '15px', marginBottom: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px', textAlign: 'left' }}
                    >
                      {option.option_text}
                      {option.product_name && <div style={{ fontSize: '14px', marginTop: '5px' }}>Product: {option.product_name}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CustomerLoyalty() {
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoyalty();
  }, []);

  const loadLoyalty = async () => {
    try {
      const response = await customerAPI.getLoyalty();
      setLoyalty(response.data.data);
    } catch (err) {
      console.error('Error loading loyalty:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Loyalty Points</h1>
      <Link to="/customer/products" style={{ color: '#007bff' }}>Back to Products</Link>

      <div style={{ marginTop: '20px' }}>
        {loyalty?.loyaltyAccounts?.length === 0 ? (
          <p>No loyalty points yet. Start making purchases!</p>
        ) : (
          <div>
            <div style={{ backgroundColor: '#007bff', color: 'white', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Total Points: {loyalty?.totalPoints || 0}</h2>
              <p style={{ margin: '5px 0 0 0' }}>Lifetime Points: {loyalty?.totalLifetimePoints || 0}</p>
            </div>
            {loyalty?.loyaltyAccounts?.map(account => (
              <div key={account.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                <h3>{account.machine_name}</h3>
                <p>{account.location}</p>
                <p><strong>Points Balance:</strong> {account.points_balance}</p>
                <p><strong>Lifetime Points:</strong> {account.lifetime_points}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Vending Machine Platform</h1>
      <p>Choose your portal:</p>
      <div style={{ marginTop: '30px' }}>
        <Link to="/vendor/login" style={{ display: 'inline-block', padding: '15px 30px', margin: '10px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Vendor Portal
        </Link>
        <Link to="/customer/login" style={{ display: 'inline-block', padding: '15px 30px', margin: '10px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Customer Portal
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Vendor Routes */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/dashboard" element={<VendorDashboard />} />
        <Route path="/vendor/machines/:id" element={<MachineDetails />} />

        {/* Customer Routes */}
        <Route path="/customer/login" element={<CustomerQRLogin />} />
        <Route path="/customer/products" element={<CustomerProducts />} />
        <Route path="/customer/polls" element={<CustomerPolls />} />
        <Route path="/customer/loyalty" element={<CustomerLoyalty />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
