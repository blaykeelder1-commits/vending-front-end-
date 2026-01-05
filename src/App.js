import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom';
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
      <h1>Customer Portal</h1>
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
        <Route path="/customer/portal" element={<CustomerLoyalty />} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
