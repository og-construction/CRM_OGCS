/*
 * MongoDB Connection Test Script
 * Tests both development (local) and production (MongoDB Atlas) connections
 */

require('dotenv').config();
const mongoose = require('mongoose');

const testConnections = async () => {
  console.log('\n🧪 MongoDB Connection Test\n');
  console.log('=' .repeat(60));

  // Test 1: Local MongoDB (Development)
  console.log('\n1️⃣  Testing Local MongoDB (Development)');
  console.log('-'.repeat(60));
  const localURI = 'mongodb://127.0.0.1:27017/ogcs_crm';
  try {
    await mongoose.connect(localURI, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: false
    });
    console.log('✅ Local MongoDB: CONNECTED');
    console.log(`   URI: ${localURI}`);
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ Local MongoDB: FAILED');
    console.log(`   Error: ${error.message}`);
  }

  // Test 2: MongoDB Atlas (Production)
  console.log('\n2️⃣  Testing MongoDB Atlas (Production)');
  console.log('-'.repeat(60));
  const atlasURI = 'mongodb+srv://ogconstructionsolution_db_user:r5NrV7gZffBuAlzu@cluster0.vid7jhi.mongodb.net/ogcs_crm?retryWrites=true&w=majority';
  try {
    await mongoose.connect(atlasURI, {
      serverSelectionTimeoutMS: 10000,
      retryWrites: true
    });
    console.log('✅ MongoDB Atlas: CONNECTED');
    console.log(`   Cluster: cluster0.vid7jhi.mongodb.net`);
    console.log(`   Database: ogcs_crm`);
    console.log(`   User: ogconstructionsolution_db_user`);
    
    // Check connection status
    const adminDb = mongoose.connection.db.admin();
    const status = await adminDb.ping();
    console.log(`   Ping: ${JSON.stringify(status)}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ MongoDB Atlas: FAILED');
    console.log(`   Error: ${error.message}`);
    if (error.message.includes('authentication failed')) {
      console.log('   💡 Hint: Check if password is correct');
    }
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('   💡 Hint: Network issue - check internet connection or IP whitelist in MongoDB Atlas');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Complete\n');
};

testConnections();
