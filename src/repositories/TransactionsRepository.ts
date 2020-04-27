import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionDTO {
  transactions: Array<Transaction>;
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  private balance: Balance;

  constructor() {
    super();

    this.balance = {
      income: 0,
      outcome: 0,
      total: 0,
    };
  }

  public async all(): Promise<TransactionDTO> {
    const transactions = await this.find();

    const balance = await this.getBalance();

    return {
      transactions,
      balance,
    };
  }

  private getIncomeValue(transactions: Array<Transaction>): number {
    return transactions.reduce((total, transaction) => {
      if (transaction.type === 'income') return total + transaction.value;

      return total;
    }, 0);
  }

  private getOutcomeValue(transactions: Array<Transaction>): number {
    return transactions.reduce((total, transaction) => {
      if (transaction.type === 'outcome') return total + transaction.value;

      return total;
    }, 0);
  }

  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const income = this.getIncomeValue(transactions);
    const outcome = this.getOutcomeValue(transactions);

    this.balance = {
      income,
      outcome,
      total: income - outcome,
    };

    return this.balance;
  }
}

export default TransactionsRepository;
