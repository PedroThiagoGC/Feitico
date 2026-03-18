import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Professional } from "./professional.entity";

@Entity("professional_exceptions")
export class ProfessionalException {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "professional_id", type: "uuid" })
  professionalId: string;

  @ManyToOne(() => Professional, { onDelete: "CASCADE" })
  @JoinColumn({ name: "professional_id" })
  professional: Professional;

  @Column({ type: "date" })
  date: string;

  @Column({ name: "start_time", type: "time", nullable: true })
  startTime: string | null;

  @Column({ name: "end_time", type: "time", nullable: true })
  endTime: string | null;

  @Column({ type: "text", default: "day_off" })
  type: string;

  @Column({ type: "text", nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
