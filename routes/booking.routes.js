// Owner reservation route
bookingRouter.post("/owner/reserve", verifyToken, createOwnerReservation); 