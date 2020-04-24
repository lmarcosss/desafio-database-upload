import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}
class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionRepository = getRepository(Transaction);

    const transactionExists = await transactionRepository.findOne({
      where: {
        id,
      },
    });

    if (!transactionExists) {
      throw new AppError('Transaction doesn`t exists.', 404);
    }

    await transactionRepository.delete({
      id: transactionExists.id,
    });
  }
}

export default DeleteTransactionService;
