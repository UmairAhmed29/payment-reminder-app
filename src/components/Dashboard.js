import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Form, Row, Col, Table } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useHistory } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"; // Updated imports
import { db } from "../firebase"; // Make sure Firebase is set up
import "./Dashboard.css"; // Create this CSS file for custom styles

export default function Dashboard() {
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [payments, setPayments] = useState([]);
  const { currentUser, logout } = useAuth();
  const history = useHistory();

  // Fetch payments from Firestore
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const paymentsRef = collection(db, "payments");
        const q = query(paymentsRef, where("userId", "==", currentUser.uid), where("deleted", "==", false));
        const querySnapshot = await getDocs(q);
        const paymentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(paymentsData);
      } catch (error) {
        setError("Failed to fetch payments");
      }
    };

    fetchPayments();
  }, [currentUser]);

  const handleLogout = async () => {
    setError("");

    try {
      await logout();
      history.push("/login");
    } catch {
      setError("Failed to log out");
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "payments"), {
        title,
        description,
        dueDate,
        userId: currentUser.uid,
        isPaid: false,
        deleted: false,
        createdAt: new Date().toISOString(),
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setError("");
      // Fetch updated payments without reloading the page
      const paymentsRef = collection(db, "payments");
      const q = query(paymentsRef, where("userId", "==", currentUser.uid), where("deleted", "==", false));
      const querySnapshot = await getDocs(q);
      const paymentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(paymentsData);
    } catch (error) {
      setError("Failed to add payment");
    }
  };

  const handleDeletePayment = async (id) => {
    try {
      const paymentRef = doc(db, "payments", id);
      await updateDoc(paymentRef, { deleted: true });
      setPayments(payments.filter(payment => payment.id !== id));
    } catch (error) {
      setError("Failed to delete payment");
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      const paymentRef = doc(db, "payments", id);
      await updateDoc(paymentRef, { isPaid: true });
      setPayments(payments.map(payment => payment.id === id ? { ...payment, isPaid: true } : payment));
    } catch (error) {
      setError("Failed to mark payment as paid");
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Dashboard</h2>
        </div>
        <ul className="sidebar-menu">
          <li><Button variant="link">Dashboard</Button></li>
          <li><Button variant="link">Payments</Button></li>
          <li><Button variant="link">Due Payments</Button></li>
          <li><Button variant="link">Settings</Button></li>
        </ul>
      </aside>
      <main className="content">
        <header className="header">
          <h2 className="header-title">Payment Reminder App</h2>
        </header>
        <Card className="mb-4">
          <Card.Body>
            <h2 className="text-center mb-4">Add Payment</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleAddPayment}>
              <Row>
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="input-field"
                  />
                </Col>
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="input-field"
                  />
                </Col>
                <Col>
                    <Form.Control
                      type="date"
                      placeholder="Due Date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="input-field"
                    />
                  </Col>
                <Col>
                  <Button type="submit" className="btn-block add-button">Add Payment</Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <h2 className="text-center mb-4">Payments List</h2>
            <Table striped bordered hover className="payment-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>{payment.title}</td>
                    <td>{payment.description}</td>
                    <td>{payment.dueDate}</td>
                    <td>{payment.isPaid ? "Paid" : "Unpaid"}</td>
                    <td>
                      <Button variant="success" onClick={() => handleMarkAsPaid(payment.id)} disabled={payment.isPaid}>
                        Mark as Paid
                      </Button>{' '}
                      <Button variant="danger" onClick={() => handleDeletePayment(payment.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        <div className="w-100 text-center mt-2">
          <Button variant="link" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </main>
    </div>
  );
}