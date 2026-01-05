import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { authAPI, vendorAPI, customerAPI } from './services/api';
import QRCode from 'qrcode';
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

      console.log('=== VENDOR LOGIN/REGISTER ===');
      console.log('Attempting:', isLogin ? 'Login' : 'Register');

      const response = isLogin
        ? await authAPI.vendorLogin(data)
        : await authAPI.vendorRegister(data);

      console.log('Auth response:', response.data);
      const token = response.data.data.token;
      console.log('Token received:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');

      localStorage.setItem('token', token);
      localStorage.setItem('userType', 'vendor');

      console.log('Token saved to localStorage');
      console.log('Verify localStorage token:', localStorage.getItem('token')?.substring(0, 20) + '...');

      navigate('/vendor/dashboard');
    } catch (err) {
      console.error('Login error:', err);
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
  const [loading, setLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date().toLocaleTimeString());
  const navigate = useNavigate();

  useEffect(() => {
    console.log('=== VENDOR DASHBOARD MOUNTED ===');
    console.log('Token in localStorage:', localStorage.getItem('token')?.substring(0, 20) + '...');
    console.log('UserType:', localStorage.getItem('userType'));

    // Check if token exists before loading data
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ NO TOKEN FOUND - Redirecting to login');
      alert('No authentication token found. Please login again.');
      navigate('/vendor/login');
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('=== loadData() CALLED ===');
      console.log('Current token:', localStorage.getItem('token')?.substring(0, 20) + '...');
      const [machinesRes, productsRes] = await Promise.allSettled([
        vendorAPI.getMachines(),
        vendorAPI.getProducts()
      ]);
      console.log('=== API RESPONSES ===');

      if (machinesRes.status === 'fulfilled') {
        console.log('Full machines response:', JSON.stringify(machinesRes.value.data, null, 2));
        const newMachines = machinesRes.value.data.data.machines;
        console.log('Extracted machines array:', newMachines);
        console.log('Machines count:', newMachines?.length || 0);
        setMachines(newMachines);
      } else {
        console.error('Machines API failed:', machinesRes.reason);
      }

      if (productsRes.status === 'fulfilled') {
        console.log('Full products response:', JSON.stringify(productsRes.value.data, null, 2));
        const newProducts = productsRes.value.data.data.products;
        console.log('Extracted products array:', newProducts);
        console.log('Products count:', newProducts?.length || 0);
        setProducts(newProducts);
      } else {
        console.error('Products API failed:', productsRes.reason);
      }

      setLastUpdateTime(new Date().toLocaleTimeString());
      console.log('=== STATE UPDATED ===');
    } catch (err) {
      console.error('=== ERROR IN loadData() ===');
      console.error('Error loading data:', err);
      console.error('Full error:', err.response || err);
      alert('Error loading data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    navigate('/vendor/login');
  };

  const handleDownloadQR = async (machineId) => {
    try {
      const baseUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
      const qrUrl = `${baseUrl}/customer/machine/${machineId}`;

      const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 512 });

      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `machine-${machineId}-qr.png`;
      link.click();
    } catch (err) {
      console.error('Error generating QR:', err);
      alert('Failed to generate QR code');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>Vendor Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: '5px 0 0 0' }}>
            Last updated: {lastUpdateTime} {loading && <span style={{ color: '#007bff' }}>⟳ Refreshing...</span>}
          </p>
        </div>
        <div>
          <button onClick={loadData} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', cursor: 'pointer' }}>
            🔄 Refresh
          </button>
          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
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
              <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                <Link to={`/vendor/machines/${machine.id}`} style={{ color: '#007bff' }}>View Details</Link>
                <button
                  onClick={() => handleDownloadQR(machine.id)}
                  style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                >
                  Download QR
                </button>
              </div>
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
      console.log('Calling onSuccess callback...');
      // Add a small delay to ensure database transaction completes
      setTimeout(() => {
        console.log('Triggering onSuccess after delay...');
        onSuccess();
      }, 500);
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
      console.log('Creating product...', { productName, price, category });
      const response = await vendorAPI.createProduct({ productName, price: parseFloat(price), category });
      console.log('Product created:', response.data);
      setProductName('');
      setPrice('');
      setCategory('');
      alert('Product created successfully!');
      console.log('Calling onSuccess callback for product...');
      // Add a small delay to ensure database transaction completes
      setTimeout(() => {
        console.log('Triggering onSuccess after delay...');
        onSuccess();
      }, 500);
    } catch (err) {
      console.error('Error creating product:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create product';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
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
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountProductId, setDiscountProductId] = useState('');
  const [percentOff, setPercentOff] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMachineData();
  }, [id]);

  const loadMachineData = async () => {
    try {
      setLoading(true);
      const [machineRes, inventoryRes, productsRes, discountsRes] = await Promise.allSettled([
        vendorAPI.getMachine(id),
        vendorAPI.getMachineInventory(id),
        vendorAPI.getProducts(),
        vendorAPI.getMachineDiscounts(id)
      ]);

      if (machineRes.status === 'fulfilled') {
        setMachine(machineRes.value.data.data.machine);
      } else {
        console.error('Machine API failed:', machineRes.reason);
        setError('Failed to load machine data');
      }

      if (inventoryRes.status === 'fulfilled') {
        setInventory(inventoryRes.value.data.data.inventory);
      } else {
        console.error('Inventory API failed:', inventoryRes.reason);
        setError('Failed to load inventory');
      }

      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value.data.data.products);
      } else {
        console.error('Products API failed:', productsRes.reason);
        setError('Failed to load products');
      }

      if (discountsRes.status === 'fulfilled') {
        setDiscounts(discountsRes.value.data.data.discounts);
      } else {
        console.error('Discounts API failed:', discountsRes.reason);
      }
    } catch (err) {
      console.error('Error loading machine data:', err);
      setError('Failed to load machine data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await vendorAPI.addToInventory(id, {
        productId: parseInt(selectedProductId),
        stockQuantity: parseInt(stockQuantity)
      });
      setSelectedProductId('');
      setStockQuantity('');
      setShowAddForm(false);
      loadMachineData();
      alert('Product added to machine inventory!');
    } catch (err) {
      console.error('Error adding product:', err);
      const errorMsg = err.response?.data?.message || 'Failed to add product';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    }
  };

  const handleCreateDiscount = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        code: discountCode,
        percentOff: parseFloat(percentOff)
      };
      if (discountProductId) payload.productId = parseInt(discountProductId);
      if (startsAt) payload.startsAt = startsAt;
      if (endsAt) payload.endsAt = endsAt;

      await vendorAPI.createDiscount(id, payload);
      setDiscountCode('');
      setDiscountProductId('');
      setPercentOff('');
      setStartsAt('');
      setEndsAt('');
      setShowDiscountForm(false);
      loadMachineData();
      alert('Discount code created successfully!');
    } catch (err) {
      console.error('Error creating discount:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create discount';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    }
  };

  const handleDeleteDiscount = async (discountId) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) return;
    try {
      await vendorAPI.deleteDiscount(id, discountId);
      loadMachineData();
      alert('Discount code deleted!');
    } catch (err) {
      console.error('Error deleting discount:', err);
      alert('Error: ' + (err.response?.data?.message || 'Failed to delete discount'));
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/vendor/dashboard" style={{ color: '#007bff', marginBottom: '20px', display: 'inline-block' }}>← Back to Dashboard</Link>

      {machine && (
        <div style={{ marginBottom: '30px' }}>
          <h2>{machine.machine_name}</h2>
          <p><strong>Location:</strong> {machine.location}</p>
          <p><strong>Status:</strong> {machine.is_active ? '✅ Active' : '❌ Inactive'}</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Inventory ({inventory.length} products)</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {showAddForm ? 'Cancel' : 'Assign Product'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddProduct} style={{ backgroundColor: '#f8f9fa', padding: '20px', marginTop: '10px', borderRadius: '5px' }}>
            <h4>Assign Product to Machine</h4>
            <div style={{ marginBottom: '10px' }}>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                required
              >
                <option value="">Select a product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} - ${product.price}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="number"
                placeholder="Stock Quantity"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                min="0"
                required
              />
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
              Add to Inventory
            </button>
          </form>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {inventory.length === 0 ? (
          <p>No products assigned to this machine yet.</p>
        ) : (
          inventory.map(item => (
            <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
              <h4>{item.product_name}</h4>
              <p><strong>Price:</strong> ${item.price}</p>
              <p><strong>Stock:</strong> {item.current_stock}</p>
              {item.description && <p style={{ fontSize: '14px', color: '#666' }}>{item.description}</p>}
            </div>
          ))
        )}
      </div>

      {/* Discount Codes Section */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Discount Codes ({discounts.filter(d => d.is_active).length} active)</h3>
          <button
            onClick={() => setShowDiscountForm(!showDiscountForm)}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {showDiscountForm ? 'Cancel' : 'Create Discount Code'}
          </button>
        </div>

        {showDiscountForm && (
          <form onSubmit={handleCreateDiscount} style={{ backgroundColor: '#f8f9fa', padding: '20px', marginTop: '10px', borderRadius: '5px' }}>
            <h4>Create Discount Code</h4>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Discount Code (e.g., SAVE15)"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <select
                value={discountProductId}
                onChange={(e) => setDiscountProductId(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">All products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.product_name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="number"
                placeholder="Percent Off (0-100)"
                value={percentOff}
                onChange={(e) => setPercentOff(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Starts At (optional):</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Ends At (optional):</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
              Create Discount
            </button>
          </form>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {discounts.length === 0 ? (
            <p>No discount codes created yet.</p>
          ) : (
            discounts.map(discount => (
              <div key={discount.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px', backgroundColor: discount.is_active ? '#fff' : '#f8f9fa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{discount.code}</h4>
                  <button
                    onClick={() => handleDeleteDiscount(discount.id)}
                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                </div>
                <p><strong>Product:</strong> {discount.product_name || 'All products'}</p>
                <p><strong>Discount:</strong> {discount.discount_value}% off</p>
                {discount.valid_from && <p style={{ fontSize: '14px', color: '#666' }}><strong>Starts:</strong> {new Date(discount.valid_from).toLocaleString()}</p>}
                {discount.valid_until && <p style={{ fontSize: '14px', color: '#666' }}><strong>Ends:</strong> {new Date(discount.valid_until).toLocaleString()}</p>}
                {discount.max_uses && <p style={{ fontSize: '14px', color: '#666' }}><strong>Uses:</strong> {discount.current_uses}/{discount.max_uses}</p>}
                <p style={{ fontSize: '14px', marginTop: '10px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '3px', backgroundColor: discount.is_active ? '#28a745' : '#6c757d', color: 'white', fontSize: '12px' }}>
                    {discount.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CUSTOMER COMPONENTS
// ============================================

function CustomerLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = window.location;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = isLogin
        ? { email, password }
        : { email, password, fullName };

      const response = isLogin
        ? await authAPI.customerLogin(data)
        : await authAPI.customerRegister(data);

      const token = response.data.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('userType', 'customer');

      // Check for returnTo query parameter
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo') || '/customer/portal';
      navigate(returnTo);
    } catch (err) {
      console.error('Customer auth error:', err);
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Customer {isLogin ? 'Login' : 'Register'}</h2>
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

function CustomerQRScan() {
  const [qrData, setQrData] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = window.location;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/customer/login?returnTo=/customer/scan');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await authAPI.customerQRLogin({ qrData });
      localStorage.setItem('token', response.data.data.sessionToken);
      localStorage.setItem('userType', 'customer');

      // Check for returnTo query parameter
      const params = new URLSearchParams(location.search);
      const returnTo = params.get('returnTo') || '/customer/products';
      navigate(returnTo);
    } catch (err) {
      setError(err.response?.data?.message || 'QR login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Scan QR Code</h2>
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
          Scan QR Code
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link to="/customer/portal" style={{ color: '#007bff' }}>View Portal</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: '10px' }}>
        <Link to="/" style={{ color: '#007bff' }}>Back to Home</Link>
      </p>
    </div>
  );
}

function CustomerMachine() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initMachine = async () => {
      // Check if logged in
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to login with returnTo
        navigate(`/customer/login?returnTo=/customer/machine/${machineId}`);
        return;
      }

      // Set machine session
      try {
        await customerAPI.setMachine({ machineId: parseInt(machineId) });
        setLoading(false);
      } catch (err) {
        console.error('Error setting machine:', err);
        alert('Error: ' + (err.response?.data?.message || 'Failed to set machine'));
        navigate('/customer/login');
      }
    };

    initMachine();
  }, [machineId, navigate]);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return <CustomerProducts />;
}

function CustomerProducts() {
  const [machineData, setMachineData] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showPointsForm, setShowPointsForm] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [showRedeemForm, setShowRedeemForm] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadMachine();
  }, []);

  const loadMachine = async () => {
    try {
      setLoading(true);
      const [machineRes, discountsRes] = await Promise.allSettled([
        customerAPI.getMachine(),
        customerAPI.getMachineDiscounts()
      ]);

      if (machineRes.status === 'fulfilled') {
        setMachineData(machineRes.value.data.data);
      } else {
        console.error('Machine API failed:', machineRes.reason);
      }

      if (discountsRes.status === 'fulfilled') {
        setDiscounts(discountsRes.value.data.data.discounts);
      } else {
        console.error('Discounts API failed:', discountsRes.reason);
      }

      // Try to load current balance (may fail if not registered)
      try {
        const loyaltyRes = await customerAPI.getLoyalty();
        const accounts = loyaltyRes.data.data.loyaltyAccounts || [];
        const machineAccount = accounts.find(acc => acc.machine_id === machineData?.machine?.id);
        setCurrentBalance(machineAccount?.points_balance || 0);
      } catch (err) {
        console.log('Loyalty not available (customer may not be registered)');
      }
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

  const handleSubmitPoints = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await customerAPI.submitPoints({ pointsEarned: parseInt(pointsToAdd) });
      setPointsToAdd('');
      setShowPointsForm(false);
      loadMachine();
      alert('Points submitted successfully!');
    } catch (err) {
      console.error('Error submitting points:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit points';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    }
  };

  const handleRedeemDiscount = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await customerAPI.redeemDiscount({ code: redeemCode });
      setRedeemCode('');
      setShowRedeemForm(false);
      loadMachine();
      alert(response.data.message);
    } catch (err) {
      console.error('Error redeeming discount:', err);
      const errorMsg = err.response?.data?.message || 'Failed to redeem discount';
      setError(errorMsg);
      alert('Error: ' + errorMsg);
    }
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
        <Link to="/customer/portal" style={{ color: '#007bff' }}>Customer Portal</Link>
      </div>

      <h2>Available Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {machineData?.products?.map(product => (
          <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>{product.product_name}</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Stock:</strong> {product.current_stock}</p>
            {product.description && <p style={{ fontSize: '14px', color: '#666' }}>{product.description}</p>}
          </div>
        ))}
      </div>

      {/* Loyalty Points Section */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Loyalty Points</h2>
          <button
            onClick={() => setShowPointsForm(!showPointsForm)}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {showPointsForm ? 'Cancel' : 'Submit Points'}
          </button>
        </div>

        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
          <p style={{ fontSize: '18px', margin: 0 }}><strong>Current Balance:</strong> {currentBalance} points</p>
        </div>

        {showPointsForm && (
          <form onSubmit={handleSubmitPoints} style={{ backgroundColor: '#fff', padding: '20px', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h4>Submit Points</h4>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="number"
                placeholder="Points to add"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
                style={{ width: '100%', padding: '8px' }}
                min="1"
                required
              />
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
              Submit
            </button>
          </form>
        )}
      </div>

      {/* Redeem Discount Section */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Redeem Discount Code</h2>
          <button
            onClick={() => setShowRedeemForm(!showRedeemForm)}
            style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {showRedeemForm ? 'Cancel' : 'Redeem Code'}
          </button>
        </div>

        {showRedeemForm && (
          <form onSubmit={handleRedeemDiscount} style={{ backgroundColor: '#fff', padding: '20px', marginTop: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h4>Enter Discount Code</h4>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Enter code (e.g., SAVE15)"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '8px', textTransform: 'uppercase' }}
                required
              />
            </div>
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
              Redeem
            </button>
          </form>
        )}
      </div>

      {/* Active Discounts Section */}
      <div style={{ marginTop: '40px' }}>
        <h2>Active Discounts</h2>
        {discounts.length === 0 ? (
          <p>No active discounts at this time.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {discounts.map(discount => (
              <div key={discount.id} style={{ border: '1px solid #28a745', padding: '15px', borderRadius: '5px', backgroundColor: '#f0fff4' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>{discount.code}</h3>
                <p><strong>Discount:</strong> {discount.discount_value}% off</p>
                <p><strong>Product:</strong> {discount.product_name || 'All products'}</p>
                {discount.valid_until && (
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    <strong>Valid until:</strong> {new Date(discount.valid_until).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
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
      <Link to="/customer/portal" style={{ color: '#007bff' }}>Back to Portal</Link>

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

function DiscountHub() {
  const [discountCode, setDiscountCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [activeDiscounts, setActiveDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/customer/login?returnTo=/customer/discount-hub');
      return;
    }
    loadLoyalty();
    const savedMachineId = localStorage.getItem('selectedMachineId');
    if (savedMachineId) {
      const machineId = parseInt(savedMachineId);
      setSelectedMachineId(machineId);
      loadActiveDiscounts(machineId);
    }
  }, [navigate]);

  useEffect(() => {
    if (selectedMachineId) {
      loadActiveDiscounts(selectedMachineId);
    }
  }, [selectedMachineId]);

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

  const handleRedeemDiscount = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedMachineId) {
      setError('Please scan QR code to select a machine first');
      return;
    }

    try {
      const response = await customerAPI.redeemDiscount({ code: discountCode });
      alert(response.data.message || 'Discount redeemed successfully!');
      setDiscountCode('');
      loadLoyalty();
    } catch (err) {
      console.error('Error redeeming discount:', err);
      const errorMsg = err.response?.data?.message || 'Failed to redeem discount';
      setError(errorMsg);
    }
  };

  const handleSelectMachine = (machineId) => {
    setSelectedMachineId(machineId);
    localStorage.setItem('selectedMachineId', machineId.toString());
    setShowScanner(false);
    loadActiveDiscounts(machineId);
  };

  const loadActiveDiscounts = async (machineId) => {
    if (!machineId) return;
    try {
      setLoadingDiscounts(true);
      const response = await customerAPI.getMachineDiscounts(machineId);
      setActiveDiscounts(response.data.data.discounts || []);
    } catch (err) {
      console.error('Error loading discounts:', err);
      setActiveDiscounts([]);
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const handleStartRedemption = (discount) => {
    setSelectedDiscount(discount);
    setProofImage(null);
    setError('');
    setShowRedemptionModal(true);
  };

  const handleSubmitRedemption = async () => {
    if (!proofImage) {
      setError('Please select a proof of purchase image');
      return;
    }

    if (!selectedDiscount || !selectedMachineId) {
      setError('Missing required information');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('machineId', selectedMachineId);
      formData.append('discountId', selectedDiscount.id);
      formData.append('proofImage', proofImage);

      const response = await customerAPI.submitRedemption(formData);

      alert(response.data.message || 'Redemption successful!');
      setShowRedemptionModal(false);
      setSelectedDiscount(null);
      setProofImage(null);

      // Reload data
      loadLoyalty();
      loadActiveDiscounts(selectedMachineId);
    } catch (err) {
      console.error('Error submitting redemption:', err);
      const errorMsg = err.response?.data?.message || 'Failed to submit redemption';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedeemReward = async (rewardName) => {
    if ((loyalty?.totalPoints || 0) < 100) {
      alert('You need at least 100 points to redeem a reward');
      return;
    }

    alert(`Redeeming ${rewardName} for 100 points (Backend integration pending)`);
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  const totalPoints = loyalty?.totalPoints || 0;
  const progressPercent = Math.min((totalPoints % 100), 100);
  const canRedeem = totalPoints >= 100;

  const rewards = [
    { name: 'Honey Buns', points: 100 },
    { name: 'Coke', points: 100 },
    { name: 'Sprite', points: 100 },
    { name: 'Sandwich', points: 100 },
    { name: 'Chips', points: 100 },
    { name: 'Water', points: 100 },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Discount Hub</h1>
      <button onClick={() => navigate('/customer/portal')} style={{ marginBottom: '20px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        ← Back to Portal
      </button>

      <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Selected Machine</h3>
        {selectedMachineId ? (
          <p style={{ color: '#28a745', fontWeight: 'bold' }}>Machine #{selectedMachineId} selected</p>
        ) : (
          <p style={{ color: '#dc3545' }}>No machine selected</p>
        )}
        <button
          onClick={() => setShowScanner(!showScanner)}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginTop: '10px' }}
        >
          {showScanner ? 'Close Scanner' : 'Scan QR Code'}
        </button>
      </div>

      {showScanner && (
        <div style={{ backgroundColor: '#fff', padding: '20px', border: '2px solid #007bff', borderRadius: '5px', marginBottom: '20px' }}>
          <h3>Scan Machine QR Code</h3>
          <p>Enter machine ID manually or scan QR code:</p>
          <input
            type="number"
            placeholder="Enter Machine ID"
            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                handleSelectMachine(parseInt(e.target.value));
              }
            }}
          />
          <button
            onClick={() => navigate('/customer/scan')}
            style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Open Camera Scanner
          </button>
        </div>
      )}

      {selectedMachineId && (
        <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Active Discounts</h3>
          {loadingDiscounts ? (
            <p>Loading discounts...</p>
          ) : activeDiscounts.length === 0 ? (
            <p style={{ color: '#666' }}>No active discounts available for this machine.</p>
          ) : (
            <div>
              {activeDiscounts.map((discount) => (
                <div
                  key={discount.id}
                  style={{
                    padding: '15px',
                    marginBottom: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#007bff' }}>{discount.code}</h4>
                      {discount.product_name && <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Product:</strong> {discount.product_name}</p>}
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        <strong>Discount:</strong> {discount.discount_value}% off
                      </p>
                      {discount.valid_until && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                          Expires: {new Date(discount.valid_until).toLocaleDateString()}
                        </p>
                      )}
                      {discount.max_uses && (
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                          {discount.max_uses - discount.current_uses} uses remaining
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleStartRedemption(discount)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginLeft: '15px'
                      }}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showRedemptionModal && selectedDiscount && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Redeem: {selectedDiscount.code}</h3>
            <p>Upload proof of purchase to redeem this discount and earn 10 loyalty points.</p>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Proof of Purchase Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setProofImage(e.target.files[0]);
                  setError('');
                }}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
              />
              {proofImage && (
                <p style={{ marginTop: '5px', fontSize: '14px', color: '#28a745' }}>
                  Selected: {proofImage.name}
                </p>
              )}
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleSubmitRedemption}
                disabled={submitting || !proofImage}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: submitting || !proofImage ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: submitting || !proofImage ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Redemption'}
              </button>
              <button
                onClick={() => {
                  setShowRedemptionModal(false);
                  setSelectedDiscount(null);
                  setProofImage(null);
                  setError('');
                }}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid #ddd', borderRadius: '5px', marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>Points Progress</h3>
        <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          {totalPoints} / 100 points toward next reward
        </p>
        <div style={{ width: '100%', height: '30px', backgroundColor: '#e9ecef', borderRadius: '15px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: totalPoints >= 100 ? '#28a745' : '#007bff',
              transition: 'width 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {progressPercent}%
          </div>
        </div>
        {canRedeem && (
          <p style={{ color: '#28a745', fontWeight: 'bold', marginTop: '10px' }}>
            🎉 You have enough points to redeem a reward!
          </p>
        )}
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3 style={{ marginTop: 0 }}>Available Rewards (100 Points Each)</h3>
        {rewards.map((reward, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              marginBottom: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '5px',
              border: '1px solid #dee2e6'
            }}
          >
            <div>
              <strong>{reward.name}</strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>{reward.points} points</p>
            </div>
            <button
              onClick={() => handleRedeemReward(reward.name)}
              disabled={!canRedeem}
              style={{
                padding: '10px 20px',
                backgroundColor: canRedeem ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: canRedeem ? 'pointer' : 'not-allowed',
                fontWeight: 'bold',
                opacity: canRedeem ? 1 : 0.6
              }}
            >
              {canRedeem ? 'Redeem' : 'Locked'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerLoyalty() {
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/customer/login?returnTo=/customer/portal');
      return;
    }
    loadLoyalty();
  }, [navigate]);

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
      <h1>Customer Portal</h1>

      <div style={{ marginTop: '20px' }}>
        {loyalty?.loyaltyAccounts?.length === 0 ? (
          <p>No loyalty points yet. Start making purchases!</p>
        ) : (
          <div>
            <div style={{ backgroundColor: '#007bff', color: 'white', padding: '20px', borderRadius: '5px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Total Points: {loyalty?.totalPoints || 0}</h2>
              <p style={{ margin: '5px 0 0 0' }}>Lifetime Points: {loyalty?.totalLifetimePoints || 0}</p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <button
                onClick={() => navigate('/customer/polls')}
                style={{ flex: 1, padding: '15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
              >
                View Polls
              </button>
              <button
                onClick={() => navigate('/customer/discount-hub')}
                style={{ flex: 1, padding: '15px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
              >
                Discount Hub
              </button>
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
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/scan" element={<CustomerQRScan />} />
        <Route path="/customer/machine/:machineId" element={<CustomerMachine />} />
        <Route path="/customer/polls" element={<CustomerPolls />} />
        <Route path="/customer/loyalty" element={<CustomerLoyalty />} />
        <Route path="/customer/portal" element={<CustomerLoyalty />} />
        <Route path="/customer/discount-hub" element={<DiscountHub />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
