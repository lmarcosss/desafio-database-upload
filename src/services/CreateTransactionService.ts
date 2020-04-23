import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import CategoryService from './CreateCategoryService';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('The balance is not enough to this transaction.');
    }

    const categoryService = new CategoryService();

    const newCategory = await categoryService.execute({ title: category });

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: {
        id: newCategory.id,
        title: newCategory.title,
      },
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
