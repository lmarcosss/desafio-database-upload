import fs from 'fs';
import csv from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  path: string;
}

interface FileTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async getCSVInformations(
    path: string,
  ): Promise<{ transactionsCSV: FileTransaction[]; categoriesCSV: string[] }> {
    const transactionsCSV: FileTransaction[] = await new Promise(resolve => {
      const transactions: FileTransaction[] = [];

      const readFile = fs
        .createReadStream(path)
        .pipe(csv({ columns: true, trim: true }));

      readFile.on('data', async data => {
        transactions.push(data);
      });

      readFile.on('end', () => {
        resolve(transactions);
      });
    });

    const categoriesCSV = transactionsCSV.map(
      transactionCSV => transactionCSV.category,
    );

    return { transactionsCSV, categoriesCSV };
  }

  async saveCategories(categories: string[]): Promise<Category[]> {
    const categoryRepository = getRepository(Category);

    const existentsCategories = await categoryRepository.find({
      where: { title: In(categories) },
    });

    const existentsCategoryTitles = existentsCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentsCategoryTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({ title })),
    );

    await categoryRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentsCategories];

    return finalCategories;
  }

  async saveTransactions(
    transactions: FileTransaction[],
    categories: Category[],
  ): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: Number(transaction.value),
        type: transaction.type,
        category: categories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);

    return createdTransactions;
  }

  async execute({ path }: Request): Promise<Transaction[]> {
    const { transactionsCSV, categoriesCSV } = await this.getCSVInformations(
      path,
    );

    const categories = await this.saveCategories(categoriesCSV);

    const transactions = await this.saveTransactions(
      transactionsCSV,
      categories,
    );

    return transactions;
  }
}

export default ImportTransactionsService;
