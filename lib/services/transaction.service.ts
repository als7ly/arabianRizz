
import { handleError } from '../utils';
import { connectToDatabase } from '../database/mongoose';
import Transaction from '../database/models/transaction.model';
import User from '../database/models/user.model';

export async function createTransaction(transaction: CreateTransactionParams) {
  try {
    await connectToDatabase();

    // Create a new transaction with a buyerId
    const newTransaction = await Transaction.create({
      ...transaction,
      buyer: transaction.buyerId
    });

    // Update the user's credit balance
    await User.findByIdAndUpdate(transaction.buyerId, {
      $inc: { creditBalance: transaction.credits }
    });

    return JSON.parse(JSON.stringify(newTransaction));
  } catch (error) {
    handleError(error);
  }
}
